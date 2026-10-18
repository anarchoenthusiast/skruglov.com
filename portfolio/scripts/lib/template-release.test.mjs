import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { freezeRelease, verifyRelease, prepareConsumer, planConsumer, verifyConsumer, promoteConsumer, safePath } from './template-release.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const write = async (file, value) => { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, typeof value === 'string' ? value : JSON.stringify(value)); };
async function fixture(t, change = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pagepilot-release-')); t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  const family = { version: 1, id: 'independent', prototypes: { hero: { fields: { title: { kind: 'text' } }, repeaters: {} } }, chrome: {} };
  const document = { version: 1, id: 'home', family: 'independent', blocks: [{ id: 'hero', prototype: 'hero', fields: { title: 'A completely independent fixture' }, lists: {} }] };
  const contents = { 'src/runtime.js': 'export const version = 1;', 'data/family.json': JSON.stringify(family), 'data/documents/home.json': JSON.stringify(document), 'src/content/theme.json': '{"ink":"black"}', 'package.json': '{"scripts":{"build":"node -e 0"}}', ...change };
  const files = {}; for (const [file, text] of Object.entries(contents)) { await write(path.join(source, file), text); files[file] = sha(text); }
  await write(path.join(source, 'verification/release.json'), { accepted: true, scope: 'independent synthetic test', buildId: 'fixture-build', checks: { build: { passed: true }, responsive: { passed: true } }, files });
  await write(path.join(source, '.site-template-manifest.json'), { accepted: true, routes: ['/'], acceptance: { buildId: 'fixture-build' } });
  const recipe = { version: 1, id: 'example', release: '0.1.0', source, routes: ['/'], schemaVersion: 1, projectPaths: ['data/documents/', 'src/content/theme.json', 'public/project/'], contracts: [{ schema: 'data/family.json', documents: 'data/documents/' }] };
  const recipeFile = path.join(root, 'recipe.json'); await write(recipeFile, recipe);
  return { root, source, recipe, recipeFile, release: path.join(root, 'release'), consumer: path.join(root, 'consumer'), candidate: path.join(root, 'candidate') };
}
async function freshReceipt(root) { const v = await verifyConsumer(root); await write(path.join(root, 'verification/consumer-smoke.json'), { ...v, build: true, smoke: true, widths: [390, 884, 1440], cases: v.routes.flatMap(route => [390, 884, 1440].map(width => ({ route, width, passed: true }))) }); }
test('freeze pins exact accepted bytes and cannot replace an existing version', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); const m = await verifyRelease(f.release);
  assert.equal(m.acceptance.sourceParityGranted, false); assert.equal(Object.keys(m.files).length, 5);
  await assert.rejects(freezeRelease(f.recipeFile, f.release), /new and outside/);
  await write(path.join(f.release, 'payload/src/runtime.js'), 'edited'); await assert.rejects(verifyRelease(f.release), /Edited\/incomplete/);
});
test('stale or failed acceptance blocks freeze before any output', async t => {
  const f = await fixture(t); await write(path.join(f.source, 'src/runtime.js'), 'edited'); await assert.rejects(freezeRelease(f.recipeFile, f.release), /Stale package/);
  await assert.rejects(readFile(path.join(f.release, 'template-release.json')));
});
test('release metadata and receipt tampering fail verification', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); const file = path.join(f.release, 'template-release.json');
  const m = JSON.parse(await readFile(file)); m.release = '9.9.9'; await write(file, m); await assert.rejects(verifyRelease(f.release), /digest/);
});
test('plan is read-only; initial installation cannot overwrite an existing application', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await write(path.join(f.consumer, 'app.js'), 'existing product');
  assert.match((await planConsumer(f.release, f.consumer)).conflicts[0], /new directory/);
  await assert.rejects(prepareConsumer(f.release, f.consumer, f.candidate), /new directory/); assert.equal(await readFile(path.join(f.consumer, 'app.js'), 'utf8'), 'existing product');
});
test('update preserves content, theme, new project media and deleted project defaults', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  const doc = JSON.parse(await readFile(path.join(f.consumer, 'data/documents/home.json'))); doc.blocks[0].fields.title = 'Project owned'; await write(path.join(f.consumer, 'data/documents/home.json'), doc);
  await rm(path.join(f.consumer, 'src/content/theme.json')); await write(path.join(f.consumer, 'public/project/new.svg'), '<svg/>');
  const next = path.join(f.root, 'next'); await prepareConsumer(f.release, f.consumer, next);
  assert.equal(JSON.parse(await readFile(path.join(next, 'data/documents/home.json'))).blocks[0].fields.title, 'Project owned');
  await assert.rejects(readFile(path.join(next, 'src/content/theme.json'))); assert.equal(await readFile(path.join(next, 'public/project/new.svg'), 'utf8'), '<svg/>');
});
test('local runtime edits or deletions stop update', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  await write(path.join(f.consumer, 'src/runtime.js'), 'local edit'); assert.ok((await planConsumer(f.release, f.consumer)).conflicts.some(x => x.includes('Locally edited')));
});
test('new routes require explicit selection and do not appear in the live product', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  f.recipe.routes.push('/pricing'); f.recipe.release = '0.2.0'; await write(f.recipeFile, f.recipe); await write(path.join(f.source, '.site-template-manifest.json'), { accepted: true, routes: f.recipe.routes, acceptance: { buildId: 'fixture-build' } });
  const second = path.join(f.root, 'release2'); await freezeRelease(f.recipeFile, second);
  assert.ok((await planConsumer(second, f.consumer)).conflicts.some(x => x.includes('Routes changed')));
  assert.deepEqual((await planConsumer(second, f.consumer, { routes: ['/', '/pricing'] })).conflicts, []);
});
test('API changes require acknowledgment and incompatible retained content is still rejected', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  const family = JSON.parse(await readFile(path.join(f.source, 'data/family.json'))); family.prototypes.hero.fields.caption = { kind: 'text', optional: true }; const text = JSON.stringify(family); await write(path.join(f.source, 'data/family.json'), text);
  const receipt = JSON.parse(await readFile(path.join(f.source, 'verification/release.json'))); receipt.files['data/family.json'] = sha(text); await write(path.join(f.source, 'verification/release.json'), receipt);
  f.recipe.release = '0.2.0'; f.recipe.schemaVersion = 2; await write(f.recipeFile, f.recipe); const second = path.join(f.root, 'release2'); await freezeRelease(f.recipeFile, second);
  assert.ok((await planConsumer(second, f.consumer)).conflicts.some(x => x.includes('Content API')));
  const doc = JSON.parse(await readFile(path.join(f.consumer, 'data/documents/home.json'))); doc.blocks[0].fields.unknown = 'bad'; await write(path.join(f.consumer, 'data/documents/home.json'), doc);
  await assert.rejects(prepareConsumer(second, f.consumer, path.join(f.root, 'next'), { schemaVersion: 2 }), /Unknown field/);
});
test('promotion requires current smoke, rejects live changes and preserves a previous version', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate);
  await assert.rejects(promoteConsumer(f.candidate, f.consumer)); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  const next = path.join(f.root, 'next'); await prepareConsumer(f.release, f.consumer, next); await freshReceipt(next);
  await write(path.join(f.consumer, 'new.txt'), 'changed while testing'); await assert.rejects(promoteConsumer(next, f.consumer), /changed since/);
  await rm(path.join(f.consumer, 'new.txt')); const result = await promoteConsumer(next, f.consumer); assert.ok(result.backup); assert.equal(result.productionReady, false);
});
test('changed candidate content invalidates smoke without inheriting source acceptance', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate);
  await write(path.join(f.candidate, 'new.txt'), 'new code'); await assert.rejects(promoteConsumer(f.candidate, f.consumer), /Fresh build/);
});
test('path traversal, private files, nested empty segments and symlinks are rejected', async t => {
  for (const file of ['../x', '/x', 'a//b/', '.env', 'x/.git/config', 'node_modules/x', 'a\\b']) assert.throws(() => safePath(file, true));
  const f = await fixture(t); await rm(path.join(f.source, 'src/runtime.js')); await symlink(path.join(f.source, 'package.json'), path.join(f.source, 'src/runtime.js'));
  await assert.rejects(freezeRelease(f.recipeFile, f.release), /Symlink/);
});
test('one failed declared check blocks a release even when build passes', async t => {
  const f = await fixture(t); const file = path.join(f.source, 'verification/release.json'), report = JSON.parse(await readFile(file));
  report.checks.responsive.passed = false; await write(file, report); await assert.rejects(freezeRelease(f.recipeFile, f.release), /complete passing/);
});
test('unowned collisions and Git roots cannot be overwritten', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  const lockFile = path.join(f.consumer, 'template.lock.json'), lock = JSON.parse(await readFile(lockFile)); delete lock.managedFiles['src/runtime.js']; await write(lockFile, lock);
  await write(path.join(f.consumer, 'src/runtime.js'), 'a product-owned collision');
  assert.ok((await planConsumer(f.release, f.consumer)).conflicts.some(x => x.includes('Unowned file collision')));
  await write(path.join(f.consumer, '.git'), 'gitdir: somewhere'); assert.ok((await planConsumer(f.release, f.consumer)).conflicts.some(x => x.includes('Git repository root')));
});
test('partial responsive receipts cannot promote a consumer', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate);
  const file = path.join(f.candidate, 'verification/consumer-smoke.json'), report = JSON.parse(await readFile(file)); report.cases.pop(); await write(file, report);
  await assert.rejects(promoteConsumer(f.candidate, f.consumer), /Incomplete consumer/);
});
test('new documents are seeded while previous deletions survive subsequent versions', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  await rm(path.join(f.consumer, 'src/content/theme.json'));
  const doc = JSON.parse(await readFile(path.join(f.source, 'data/documents/home.json'))); doc.id = 'pricing'; const text = JSON.stringify(doc);
  await write(path.join(f.source, 'data/documents/pricing.json'), text);
  const file = path.join(f.source, 'verification/release.json'), report = JSON.parse(await readFile(file)); report.files['data/documents/pricing.json'] = sha(text); await write(file, report);
  f.recipe.release = '0.2.0'; await write(f.recipeFile, f.recipe); const nextRelease = path.join(f.root, 'release2'); await freezeRelease(f.recipeFile, nextRelease);
  const next = path.join(f.root, 'next'); await prepareConsumer(nextRelease, f.consumer, next);
  assert.equal(JSON.parse(await readFile(path.join(next, 'data/documents/pricing.json'))).id, 'pricing'); await assert.rejects(readFile(path.join(next, 'src/content/theme.json')));
});
test('ownership extension is explicit and cannot remove existing project ownership', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  f.recipe.release = '0.2.0'; f.recipe.projectPaths.push('src/content/new-page/'); await write(f.recipeFile, f.recipe); const nextRelease = path.join(f.root, 'release2'); await freezeRelease(f.recipeFile, nextRelease);
  assert.ok((await planConsumer(nextRelease, f.consumer)).conflicts.some(x => x.includes('ownership changed')));
  assert.deepEqual((await planConsumer(nextRelease, f.consumer, { ownership: 'extend' })).conflicts, []);
  f.recipe.release = '0.3.0'; f.recipe.projectPaths = f.recipe.projectPaths.filter(x => x !== 'public/project/'); await write(f.recipeFile, f.recipe); const thirdRelease = path.join(f.root, 'release3'); await freezeRelease(f.recipeFile, thirdRelease);
  assert.ok((await planConsumer(thirdRelease, f.consumer, { ownership: 'extend' })).conflicts.some(x => x.includes('ownership changed')));
});
test('older locks recover seed ownership from immutable lineage', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  const file = path.join(f.consumer, 'template.lock.json'), lock = JSON.parse(await readFile(file)); delete lock.projectSeedFiles; await write(file, lock);
  await rm(path.join(f.consumer, 'src/content/theme.json')); const plan = await planConsumer(f.release, f.consumer);
  assert.equal(plan.changes.length, 0); assert.ok(plan.preserved.includes('src/content/theme.json'));
});
test('a deleted project file is not resurrected when the source removes and later restores its seed', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile, f.release); await prepareConsumer(f.release, f.consumer, f.candidate); await freshReceipt(f.candidate); await promoteConsumer(f.candidate, f.consumer);
  await rm(path.join(f.consumer, 'src/content/theme.json')); await rm(path.join(f.source, 'src/content/theme.json'));
  const reportFile = path.join(f.source, 'verification/release.json'), report = JSON.parse(await readFile(reportFile)); delete report.files['src/content/theme.json']; await write(reportFile, report);
  f.recipe.release = '0.2.0'; await write(f.recipeFile, f.recipe); const second = path.join(f.root, 'release2'); await freezeRelease(f.recipeFile, second);
  const next = path.join(f.root, 'next'); await prepareConsumer(second, f.consumer, next); await freshReceipt(next); await promoteConsumer(next, f.consumer);
  const text = '{"ink":"blue"}'; await write(path.join(f.source, 'src/content/theme.json'), text); report.files['src/content/theme.json'] = sha(text); await write(reportFile, report);
  f.recipe.release = '0.3.0'; await write(f.recipeFile, f.recipe); const third = path.join(f.root, 'release3'); await freezeRelease(f.recipeFile, third);
  assert.ok((await planConsumer(third, f.consumer)).preserved.includes('src/content/theme.json'));
});

test('environment examples are distributable while actual credentials are refused', async t => {
  assert.equal(safePath('.env.example'), '.env.example');
  for (const file of ['.env','.env.local','.env.production','nested/.env.secret']) assert.throws(()=>safePath(file),/Private/);
  const f = await fixture(t, {'.env.example':'SMTP_USER=\nSMTP_PASS=\n'});
  await freezeRelease(f.recipeFile,f.release); await verifyRelease(f.release);
});
test('local browser evidence does not cause runtime drift or enter update candidates', async t => {
  const f = await fixture(t); await freezeRelease(f.recipeFile,f.release); await prepareConsumer(f.release,f.consumer,f.candidate);
  const before = await verifyConsumer(f.candidate);
  await write(path.join(f.candidate,'.qa/local/result.json'),{passed:true});
  assert.equal((await verifyConsumer(f.candidate)).inputDigest,before.inputDigest);
  await freshReceipt(f.candidate); await promoteConsumer(f.candidate,f.consumer);
  const next=path.join(f.root,'next'); await prepareConsumer(f.release,f.consumer,next);
  await assert.rejects(readFile(path.join(next,'.qa/local/result.json')),/ENOENT/);
});
