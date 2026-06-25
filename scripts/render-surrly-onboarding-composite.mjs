#!/usr/bin/env node
/**
 * Render Surrly onboarding Lotties as a sequential carousel:
 * one animation at a time, crossfade transition between steps.
 *
 * Usage: node scripts/render-surrly-onboarding-composite.mjs
 */

import { execSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOTTIE_DIR = resolve(ROOT, "../surrly-app/assets/animations/lottie");
const OUT_DIR = resolve(ROOT, "src/assets/projects/surrly");
const CACHE = resolve(ROOT, ".cache/surrly-lottie-composite");

const CANVAS_W = 1920;
const CANVAS_H = 1280;
const BG = { r: 242, g: 242, b: 242 };
const FPS = 30;
const RENDER_DPR = 2;

/** Display size — 2× Figma ON1 slot, centered */
const TILE_W = 1304;
const TILE_H = 920;
const TILE_X = Math.round((CANVAS_W - TILE_W) / 2);
const TILE_Y = Math.round((CANVAS_H - TILE_H) / 2);

/** Calm crossfade between steps */
const HOLD_SEC = 0.5;
const TRANSITION_SEC = 1.0;

const STEPS = [
  { id: "step1", file: "step1.json" },
  { id: "step2", file: "step2.json" },
  { id: "step3", file: "step3.json" },
  { id: "step4", file: "step4.json" },
];

/** CSS ease-in-out cubic — close to UIView animationCurve .easeInOut */
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lottieMeta(path) {
  const d = JSON.parse(readFileSync(path, "utf8"));
  const fr = d.fr || 60;
  const ip = d.ip ?? 0;
  const op = d.op ?? fr;
  return { w: d.w, h: d.h, fr, frames: op - ip, duration: (op - ip) / fr };
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit", shell: true });
}

async function renderLottiePngSequence(lottiePath, outDir) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const meta = lottieMeta(lottiePath);
  const lottieJson = readFileSync(lottiePath, "utf8");
  const sampleStep = Math.max(1, Math.round(meta.fr / FPS));

  const html = `<!DOCTYPE html>
<html><head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${TILE_W}px; height: ${TILE_H}px; overflow: hidden; background: #F2F2F2; }
  #c { width: ${TILE_W}px; height: ${TILE_H}px; }
  #c svg { display: block; width: 100% !important; height: 100% !important; }
</style>
</head><body><div id="c"></div>
<script>
  const data = ${lottieJson};
  window.anim = lottie.loadAnimation({
    container: document.getElementById('c'),
    renderer: 'svg',
    loop: false,
    autoplay: false,
    animationData: data,
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
  });
  window.ready = new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    anim.addEventListener('DOMLoaded', finish);
    anim.addEventListener('data_ready', finish);
    setTimeout(finish, 3000);
  });
</script></body></html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: TILE_W,
    height: TILE_H,
    deviceScaleFactor: RENDER_DPR,
  });
  await page.setContent(html, { waitUntil: "load", timeout: 60000 });
  await page.evaluate(() => window.ready);

  const paths = [];
  let outIdx = 0;
  for (let i = 0; i < meta.frames; i += sampleStep) {
    await page.evaluate((frame) => window.anim.goToAndStop(frame, true), i);
    await new Promise((r) => setTimeout(r, 20));
    const raw = join(outDir, `f${String(outIdx).padStart(4, "0")}.png`);
    await (await page.$("#c")).screenshot({ path: raw, omitBackground: false });
    paths.push(raw);
    outIdx++;
  }
  await browser.close();

  return paths;
}

async function loadFrame(path) {
  return sharp(path)
    .resize(TILE_W, TILE_H, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

async function compositeFrame(layers) {
  const composites = layers
    .filter((l) => l.buffer && l.opacity > 0.001)
    .map((l) => ({
      input: l.buffer,
      raw: { width: l.width, height: l.height, channels: 4 },
      left: Math.round(l.x),
      top: Math.round(l.y),
      blend: "over",
      opacity: l.opacity,
    }));

  return sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { ...BG, alpha: 255 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function buildCarousel(sequences) {
  const holdFrames = Math.round(HOLD_SEC * FPS);
  const transFrames = Math.round(TRANSITION_SEC * FPS);
  const outDir = join(CACHE, "carousel-frames");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const frameCache = new Map();
  async function getTile(seq, frameIdx) {
    const key = `${seq.id}:${frameIdx}`;
    if (!frameCache.has(key)) {
      const idx = Math.min(frameIdx, seq.paths.length - 1);
      frameCache.set(key, await loadFrame(seq.paths[idx]));
    }
    return frameCache.get(key);
  }

  const timeline = [];
  const n = sequences.length;

  for (let i = 0; i < n; i++) {
    const seq = sequences[i];
    for (let f = 0; f < seq.paths.length; f++) {
      timeline.push({ type: "play", index: i, frame: f });
    }
    for (let f = 0; f < holdFrames; f++) {
      timeline.push({ type: "hold", index: i, frame: seq.paths.length - 1 });
    }
    if (i < n - 1) {
      for (let f = 0; f < transFrames; f++) {
        timeline.push({
          type: "transition",
          from: i,
          to: i + 1,
          t: transFrames <= 1 ? 1 : f / (transFrames - 1),
        });
      }
    }
  }

  for (let f = 0; f < transFrames; f++) {
    timeline.push({
      type: "transition",
      from: n - 1,
      to: 0,
      t: transFrames <= 1 ? 1 : f / (transFrames - 1),
    });
  }

  let outIdx = 0;
  for (const step of timeline) {
    const layers = [];

    if (step.type === "play" || step.type === "hold") {
      const tile = await getTile(sequences[step.index], step.frame);
      layers.push({
        buffer: tile.data,
        width: tile.info.width,
        height: tile.info.height,
        x: TILE_X,
        y: TILE_Y,
        opacity: 1,
      });
    } else {
      const p = easeInOut(step.t);
      const outSeq = sequences[step.from];
      const inSeq = sequences[step.to];
      const outTile = await getTile(outSeq, outSeq.paths.length - 1);
      const inTile = await getTile(inSeq, 0);

      // Crossfade at center — transparent tiles avoid gray wash between opaque layers.
      layers.push({
        buffer: inTile.data,
        width: inTile.info.width,
        height: inTile.info.height,
        x: TILE_X,
        y: TILE_Y,
        opacity: p,
      });
      layers.push({
        buffer: outTile.data,
        width: outTile.info.width,
        height: outTile.info.height,
        x: TILE_X,
        y: TILE_Y,
        opacity: 1 - p,
      });
    }

    const png = await compositeFrame(layers);
    writeFileSync(join(outDir, `out_${String(outIdx).padStart(5, "0")}.png`), png);
    outIdx++;
  }

  return { outDir, frameCount: outIdx, duration: outIdx / FPS };
}

async function main() {
  for (const step of STEPS) {
    if (!existsSync(join(LOTTIE_DIR, step.file))) {
      throw new Error(`Missing: ${join(LOTTIE_DIR, step.file)}`);
    }
  }

  mkdirSync(CACHE, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const sequences = [];
  for (const step of STEPS) {
    const seqDir = join(CACHE, step.id);
    const existing = existsSync(join(seqDir, "f0000.png"));
    let paths;
    if (existing) {
      paths = readdirSync(seqDir)
        .filter((f) => /^f\d+\.png$/.test(f))
        .sort()
        .map((f) => join(seqDir, f));
      console.log(`\n→ Reusing ${step.file} (${paths.length} frames)`);
    } else {
      console.log(`\n→ Rendering ${step.file}`);
      paths = await renderLottiePngSequence(join(LOTTIE_DIR, step.file), seqDir);
    }
    const meta = lottieMeta(join(LOTTIE_DIR, step.file));
    sequences.push({ ...step, paths, duration: paths.length / FPS });
    console.log(`  ${paths.length} frames (${meta.duration.toFixed(2)}s)`);
  }

  console.log("\n→ Building carousel with crossfade transitions");
  const { outDir, frameCount, duration } = await buildCarousel(sequences);

  const composite = join(OUT_DIR, "onboarding-lottie-composite.mp4");
  const poster = join(OUT_DIR, "onboarding-lottie-composite-poster.jpg");

  run(
    `ffmpeg -y -hide_banner -loglevel error -framerate ${FPS} -i "${outDir}/out_%05d.png" ` +
      `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "${composite}"`,
  );

  run(
    `ffmpeg -y -hide_banner -loglevel error -i "${composite}" -ss 3.5 -vframes 1 -q:v 2 "${poster}"`,
  );

  const size = execSync(`ls -lh "${composite}" | awk '{print $5}'`, { encoding: "utf8" }).trim();
  console.log(`\n✓ ${composite} (${size}, ${duration.toFixed(1)}s, ${frameCount} frames)`);
  console.log(`✓ ${poster}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
