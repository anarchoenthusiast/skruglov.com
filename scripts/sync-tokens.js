#!/usr/bin/env node
/**
 * sync-tokens.js
 *
 * Reads Figma Variables from the skruglov.com collection via Figma REST API
 * and updates src/styles/tokens.css with the current values.
 *
 * Usage:
 *   FIGMA_TOKEN=<your_personal_access_token> node scripts/sync-tokens.js
 *
 * How to get a Figma Personal Access Token:
 *   Figma → Account Settings → Personal Access Tokens → Generate new token
 *
 * The token only needs "File content" read access.
 */

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = "zjD9Ey6snTlceLpQb3YiHU";
const COLLECTION_NAME = "skruglov.com";

if (!FIGMA_TOKEN) {
  console.error("❌  Set FIGMA_TOKEN environment variable first.");
  console.error("    FIGMA_TOKEN=xxx node scripts/sync-tokens.js");
  process.exit(1);
}

// ── Fetch variables from Figma REST API ──────────────────────────────────────
async function fetchFigmaVariables() {
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/variables/local`;
  const res = await fetch(url, { headers: { "X-Figma-Token": FIGMA_TOKEN } });
  if (!res.ok) throw new Error(`Figma API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Convert Figma RGBA {r,g,b,a} to CSS string ───────────────────────────────
function rgbaToCSS({ r, g, b, a }) {
  const R = Math.round(r * 255);
  const G = Math.round(g * 255);
  const B = Math.round(b * 255);
  if (a === undefined || a >= 0.999) return `#${R.toString(16).padStart(2,"0")}${G.toString(16).padStart(2,"0")}${B.toString(16).padStart(2,"0")}`;
  return `rgba(${R},${G},${B},${Math.round(a * 100) / 100})`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("📡  Fetching variables from Figma…");
  const data = await fetchFigmaVariables();

  // Find collection
  const collection = Object.values(data.meta.variableCollections)
    .find(c => c.name === COLLECTION_NAME);

  if (!collection) {
    console.error(`❌  Collection "${COLLECTION_NAME}" not found in file.`);
    process.exit(1);
  }

  const lightModeId = collection.modes.find(m => m.name === "Light")?.modeId;
  const darkModeId  = collection.modes.find(m => m.name === "Dark")?.modeId;

  const vars = Object.values(data.meta.variables)
    .filter(v => v.variableCollectionId === collection.id);

  // Build token map: name → { light, dark }
  const tokens = {};
  for (const v of vars) {
    const lightVal = v.valuesByMode[lightModeId];
    const darkVal  = v.valuesByMode[darkModeId];

    function toCSS(val, type) {
      if (type === "COLOR" && val && typeof val === "object" && "r" in val) return rgbaToCSS(val);
      if (type === "FLOAT")  return v.name.startsWith("radius/full") ? `${val}px` : `${val}${v.resolvedType === "FLOAT" && val <= 9999 && val > 1 ? "px" : ""}`;
      if (type === "STRING") return val;
      return String(val);
    }

    tokens[v.name] = {
      light: toCSS(lightVal, v.resolvedType),
      dark:  toCSS(darkVal,  v.resolvedType),
      type:  v.resolvedType,
    };
  }

  // Read existing tokens.css template structure and regenerate values
  const tokensPath = join(ROOT, "src/styles/tokens.css");
  let css = readFileSync(tokensPath, "utf-8");

  // Update :root values
  for (const [name, { light }] of Object.entries(tokens)) {
    const cssVar = "--" + name.replace(/\//g, "-");
    css = css.replace(
      new RegExp(`(${cssVar}:\\s*)([^;]+)(;)`, "g"),
      `$1${light}$3`
    );
  }

  // Update .dark values
  for (const [name, { dark }] of Object.entries(tokens)) {
    // Only update color tokens in .dark block (FLOAT tokens are the same)
    if (tokens[name].type !== "COLOR") continue;
    const cssVar = "--" + name.replace(/\//g, "-");
    // The .dark block re-declares color vars
    const darkBlockRegex = new RegExp(`(\\.dark[\\s\\S]*?${cssVar}:\\s*)([^;]+)(;)`, "g");
    css = css.replace(darkBlockRegex, `$1${dark}$3`);
  }

  writeFileSync(tokensPath, css, "utf-8");

  console.log(`✅  Updated ${tokensPath}`);
  console.log(`    ${Object.keys(tokens).length} tokens synced from "${COLLECTION_NAME}"`);
  console.log("");
  console.log("Next steps:");
  console.log("  git diff src/styles/tokens.css   — review changes");
  console.log("  git commit -am 'sync design tokens from Figma'");
}

main().catch(err => { console.error("❌ ", err.message); process.exit(1); });
