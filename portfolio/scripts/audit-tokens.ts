import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import postcss from "postcss";
import { themes } from "../src/theme/presets";
import type { CoverageReport } from "../src/components/template-studio/schema";

const root = process.cwd();
const properties = new Set(["color", "background", "background-color", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "border-radius", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "gap", "row-gap", "column-gap", "border", "border-top", "border-right", "border-bottom", "border-left", "border-width", "border-top-width", "border-bottom-width", "outline", "outline-width", "outline-offset", "opacity", "transition", "transition-duration"]);
const ignoredValues = /^(?:0(?:px|em|rem|%)?|none|inherit|initial|unset|normal|auto|transparent|currentcolor)$/i;
const gaps: CoverageReport["gaps"] = [];
let total = 0, tokenized = 0;
const uses = new Map<string, { uses: number; files: Set<string> }>(Object.keys(themes.brightfutures).map((key) => [key, { uses: 0, files: new Set() }]));
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? entry.name === "template-studio" ? [] : files(join(directory, entry.name)) : /\.(tsx|css)$/.test(entry.name) ? [join(directory, entry.name)] : []);
}
function declaration(file: string, line: number, property: string, value: string, dynamic = false) {
  if (property === "opacity" && value === "1") return;
  if (!properties.has(property) || ignoredValues.test(value.replace(/^['"]|['"]$/g, ""))) return;
  if (dynamic && !/var\(--/.test(value) && !/^(?:["'`]|-?\d)/.test(value)) return;
  total++;
  if (/var\(--/.test(value)) tokenized++;
  else gaps.push({ file, line, property, value: value.replace(/^['"]|['"]$/g, "").slice(0, 180) });
}
function css(source: string, file: string, offset = 0) {
  postcss.parse(source, { from: file }).walkDecls((node) => {
    if (node.parent?.type === "rule" && node.parent.selector === ".visually-hidden") return;
    if (node.parent?.type === "rule" && node.parent.selector.includes("*::before") && node.parent.parent?.type === "atrule" && node.parent.parent.params === "(prefers-reduced-motion: reduce)") return;
    if (node.parent?.type !== "atrule" || node.parent.name !== "font-face") declaration(file, offset + (node.source?.start?.line ?? 1), node.prop, node.value); });
}
const sourceFiles = [...files(join(root, "src/components")), join(root, "src/app/globals.css")].sort();
for (const fullPath of sourceFiles) {
  const file = relative(root, fullPath);
  // Slide-internal composition is artwork, not the site's theme surface.
  if (file.endsWith("ProjectFigmaSlide.tsx")) continue;
  const source = readFileSync(fullPath, "utf8");
  for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    const token = uses.get(match[1]); if (token) { token.uses++; token.files.add(file); }
  }
  if (file.endsWith(".css")) { css(source, file); continue; }
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node)) {
      const property = node.name.getText(ast).replace(/['"]/g, "").replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      declaration(file, ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, property, node.initializer.getText(ast), true);
    }
    if (ts.isNoSubstitutionTemplateLiteral(node) && /^\s*(?:@media|\.[a-z])/i.test(node.text)) {
      try { css(node.text, file, ast.getLineAndCharacterOfPosition(node.getStart(ast)).line); } catch { /* Not a CSS template. */ }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const report: CoverageReport = {
  tokens: [...uses.entries()].map(([key, data]) => ({ key, uses: data.uses, files: [...data.files].sort() })),
  declarations: { total, tokenized, percentage: total ? Math.round(tokenized / total * 1000) / 10 : 0 },
  gaps,
  exclusions: [
    "Scope: authored CSS and literal React style declarations in shared page components. CSS variable references are counted separately from declaration coverage.",
    "Screen-reader-only clipping (.visually-hidden) and reduced-motion safety overrides are accessibility mechanisms and excluded, along with the editor, third-party CSS, font-face asset declarations, content files and ProjectFigmaSlide artwork. Media dimensions, positioning, image pixels, responsive breakpoints, resets, inheritance and dynamic content values are not scored.",
    "A token reference is not proof of live coverage. CSS cascade, mobile overrides, inactive states and explicit case-study artwork can prevent a response. Use the live probe in each relevant state.",
  ],
};
const output = join(root, "src/theme/token-coverage.generated.json");
const serialized = JSON.stringify(report) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== serialized) { console.error("Token audit is stale. Run npm run audit:tokens."); process.exitCode = 1; }
} else writeFileSync(output, serialized);
console.log(`Token audit: ${tokenized}/${total} declarations (${report.declarations.percentage}%), ${report.tokens.filter((token) => token.uses > 0).length}/${report.tokens.length} tokens referenced; ${gaps.length} hardcoded declarations remain in scope.`);

if (process.argv.includes("--strict") && (gaps.length || report.tokens.some(token => !token.uses))) { console.error("Template token coverage requires zero authored design gaps and no unreferenced tokens."); process.exitCode = 1; }
