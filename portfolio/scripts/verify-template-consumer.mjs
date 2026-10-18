import { spawn } from 'node:child_process';
import process from 'node:process';
import console from 'node:console';
import { setTimeout } from 'node:timers';
/* global fetch, AbortSignal, document, window, scrollTo, getComputedStyle */
import { createServer } from 'node:net';
import { mkdir, open, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { verifyConsumer } from './lib/template-release.mjs';

const root = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || process.argv.length !== 3) throw Error('Usage: verify:template-consumer <independent-candidate>');
const before = await verifyConsumer(root);
const directory = path.join(root, 'verification'); await mkdir(directory, { recursive: true });
const log = await open(path.join(directory, 'consumer-build.log'), 'w');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const exit = child => new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(Error('Candidate build failed; see verification/consumer-build.log'))); });
let server, browser;
try {
  console.log('Building the independent candidate.');
  await exit(spawn('npm', ['run', 'check'], { cwd: root, stdio: ['ignore', log.fd, log.fd], env: { ...process.env, SMTP_USER: '', SMTP_PASS: '', MIGADU_SMTP_USER: '', MIGADU_SMTP_PASS: '', NEXT_DIST_DIR: '.next' } }));
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port; await new Promise(resolve => listener.close(resolve));
  server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, detached: true, stdio: ['ignore', log.fd, log.fd], env: { ...process.env, SMTP_USER: '', SMTP_PASS: '', MIGADU_SMTP_USER: '', MIGADU_SMTP_PASS: '', NEXT_DIST_DIR: '.next' } });
  let startupError; server.once('error', error => { startupError = error; });
  const origin = 'http://127.0.0.1:' + port;
  let warm = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (startupError || server.exitCode !== null) throw startupError ?? Error('Candidate server exited');
    try { warm = (await fetch(origin + before.routes[0], { signal: AbortSignal.timeout(2000) })).ok; } catch { /* wait for owned server */ }
    if (warm) break; await wait(1000);
  }
  if (!warm) throw Error('Candidate server did not start');
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel: process.env.PLAYWRIGHT_CHANNEL} : {}) });
  const cases = [];
  for (const route of before.routes) for (const width of [390, 884, 1440]) {
    console.log('Checking ' + route + ' at ' + width + ' CSS px.');
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(origin + route, { waitUntil: 'networkidle', timeout: 180000 });
    if (!response?.ok()) throw Error('Route response failed: ' + route);
    await page.evaluate(() => document.fonts.ready);
    const max = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < max; y += 750) { await page.evaluate(y => scrollTo({ top: y, left: 0, behavior: 'instant' }), y); await page.waitForTimeout(120); }
    await page.evaluate(() => scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    await page.waitForFunction(() => Math.abs(window.scrollY) < 2, undefined, { timeout: 5000 });
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const html = document.documentElement;
      const collapsed = [...document.querySelectorAll('[data-pp-layout-section],[data-pp-carousel-section]')].filter(node => getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().height <= 0).map(node => node.getAttribute('data-pp-layout-section') ?? node.getAttribute('data-pp-carousel-section'));
      const brokenImages = [...document.images].filter(image => image.currentSrc && getComputedStyle(image).display !== 'none' && image.getBoundingClientRect().width > 0 && image.complete && image.naturalWidth === 0).map(image => image.currentSrc);
      const localLinks = [...new Set([...document.querySelectorAll('a[href]')].map(node => node.getAttribute('href')).filter(href => href.startsWith('/') && !href.startsWith('//')))];
      return { scrollY: window.scrollY, overflow: html.scrollWidth - html.clientWidth, collapsed, brokenImages, localLinks };
    });
    for (const href of result.localLinks) { const response = await context.request.get(origin + href); if (response.status() >= 400) throw Error('Broken local link: ' + href); }
    if (errors.length || result.overflow > 1 || result.collapsed.length || result.brokenImages.length) throw Error('Responsive smoke failed: ' + JSON.stringify({ route, width, errors, ...result }));
    const screenshot = 'consumer-' + (route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')) + '-' + width + '.png';
    await page.screenshot({ path: path.join(directory, screenshot) });
    cases.push({ route, width, ...result, errors, screenshot, passed: true }); await context.close();
  }
  const after = await verifyConsumer(root);
  if (before.inputDigest !== after.inputDigest || before.lockHash !== after.lockHash) throw Error('Candidate inputs changed during verification');
  const receipt = { version: 1, ...after, build: true, smoke: true, widths: [390, 884, 1440], cases, verifiedAt: new Date().toISOString(), scope: 'build, responsive smoke, image loading and local destinations; source pixel parity, complete interactions, SEO and performance remain separate', productionReady: false };
  await writeFile(path.join(directory, 'consumer-smoke.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ release: after.release, cases: cases.length, build: true, smoke: true, productionReady: false, report: path.join(directory, 'consumer-smoke.json') }));
} finally {
  await browser?.close();
  if (server?.pid) { try { process.kill(-server.pid, 'SIGTERM'); } catch { /* owned process already exited */ } }
  await log.close();
}
