#!/usr/bin/env node
/**
 * Re-encode portfolio MP4s for web delivery:
 * H.264, yuv420p, faststart, sensible bitrates for UI screencasts.
 *
 * Usage: node scripts/optimize-project-videos.mjs [relative-path...]
 * With no args, optimizes all project videos that exceed the size threshold.
 */

import { execSync } from "node:child_process";
import { readdirSync, renameSync, statSync, unlinkSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ASSETS_DIR = resolve(ROOT, "src/assets/projects");

/** @typedef {{ crf: string; maxrate: string; bufsize: string; fps?: number; maxWidth?: number; minSizeBytes?: number; force?: boolean; remuxOnly?: boolean; keepAudio?: boolean }} Profile */

/** @type {Record<string, Profile>} */
const PROFILES = {
  default: {
    crf: "26",
    maxrate: "2200k",
    bufsize: "4400k",
    fps: 30,
    minSizeBytes: 2 * 1024 * 1024,
  },
  screencast: {
    crf: "30",
    maxrate: "700k",
    bufsize: "1400k",
    fps: 30,
    maxWidth: 1400,
    force: true,
  },
  light: {
    crf: "23",
    maxrate: "3500k",
    bufsize: "7000k",
    fps: 30,
    force: true,
  },
  remux: {
    crf: "23",
    maxrate: "3500k",
    bufsize: "7000k",
    fps: 30,
    force: true,
    remuxOnly: true,
  },
  withAudio: {
    crf: "28",
    maxrate: "1200k",
    bufsize: "2400k",
    fps: 30,
    force: true,
    keepAudio: true,
  },
};

/** @type {Record<string, keyof typeof PROFILES>} */
const FILE_PROFILES = {
  "surrly/screencast-dream1-3x2.mp4": "screencast",
  "surrly/onboarding-lottie-composite.mp4": "heavy",
  "vana/slide-12-composite.mp4": "heavy",
  "vana/slide-13-composite.mp4": "heavy",
  "vana/slide-14-composite.mp4": "heavy",
  "flipp/3.mp4": "remux",
  "4k-download-site/home.mp4": "default",
  "4k-download-site/product.mp4": "default",
  "4k-download-site/cards.mp4": "default",
  "4k-download-site/pay.mp4": "default",
  "combin/slide-01.mp4": "default",
  "combin/slide-02.mp4": "default",
  "combin/slide-03.mp4": "default",
  "combin/slide-06.mp4": "default",
  "combin/slide-10.mp4": "withAudio",
  "ai-video-cut/slide-01.mp4": "default",
  "waveroom/slide-05.mp4": "default",
  "waveroom/slide-06.mp4": "default",
  "waveroom/slide-07.mp4": "default",
};

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function collectVideos(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) collectVideos(fullPath, acc);
    else if (entry.name.endsWith(".mp4")) acc.push(fullPath);
  }
  return acc;
}

function getProfile(relativePath) {
  const key = FILE_PROFILES[relativePath] ?? "default";
  return PROFILES[key];
}

function shouldOptimize(_relativePath, inputPath, profile) {
  if (profile.force) return true;
  const size = statSync(inputPath).size;
  const minSize = profile.minSizeBytes ?? PROFILES.default.minSizeBytes;
  return size >= minSize;
}

function optimizeVideo(inputPath, profile) {
  const tempPath = `${inputPath}.optimized.mp4`;

  if (profile.remuxOnly) {
    execSync(
      `ffmpeg -y -i ${JSON.stringify(inputPath)} -an -c:v copy -movflags +faststart ${JSON.stringify(tempPath)}`,
      { stdio: "inherit" },
    );
    const before = statSync(inputPath).size;
    const after = statSync(tempPath).size;
    renameSync(tempPath, inputPath);
    console.log(`  remux ${formatSize(before)} -> ${formatSize(after)}`);
    return;
  }

  const args = [
    "ffmpeg -y",
    `-i ${JSON.stringify(inputPath)}`,
  ];

  if (!profile.keepAudio) {
    args.push("-an");
  } else {
    args.push("-c:a aac", "-b:a 128k");
  }

  args.push(
    "-c:v libx264",
    `-crf ${profile.crf}`,
    `-maxrate ${profile.maxrate}`,
    `-bufsize ${profile.bufsize}`,
    "-preset slow",
    "-movflags +faststart",
    "-pix_fmt yuv420p",
  );

  const filters = [];
  if (profile.maxWidth) {
    filters.push(`scale='min(${profile.maxWidth}\\,iw)':-2`);
  }
  if (profile.fps) {
    filters.push(`fps=${profile.fps}`);
  }
  if (filters.length) {
    args.push(`-vf ${JSON.stringify(filters.join(","))}`);
  }

  args.push(JSON.stringify(tempPath));

  execSync(args.join(" "), { stdio: "inherit" });

  const before = statSync(inputPath).size;
  const after = statSync(tempPath).size;

  if (after >= before) {
    unlinkSync(tempPath);
    console.log(`  kept original (${formatSize(before)} <= ${formatSize(after)} encoded)`);
    return;
  }

  renameSync(tempPath, inputPath);
  console.log(`  ${formatSize(before)} -> ${formatSize(after)}`);
}

function main() {
  const requested = process.argv.slice(2);
  const allVideos = collectVideos(ASSETS_DIR);
  const selected = requested.length
    ? allVideos.filter((path) =>
        requested.some((part) => relative(ASSETS_DIR, path) === part || path.endsWith(part)),
      )
    : allVideos;

  if (selected.length === 0) {
    console.error("No matching MP4 files found.");
    process.exit(1);
  }

  for (const inputPath of selected.sort()) {
    const rel = relative(ASSETS_DIR, inputPath);
    const profile = getProfile(rel);

    if (!shouldOptimize(rel, inputPath, profile)) {
      console.log(`skip ${rel} (${formatSize(statSync(inputPath).size)})`);
      continue;
    }

    console.log(`optimize ${rel}`);
    optimizeVideo(inputPath, profile);
  }
}

main();
