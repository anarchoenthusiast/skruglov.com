import type { ThemeTokens } from "./presets";
export type StylePreset = { name: string; tokens: Partial<ThemeTokens> };
// Role mapping from the neighboring Granola-derived studio package; target size hierarchy is retained.
export const colorPresets: StylePreset[] = [
  {
    "name": "Are.na Light",
    "tokens": {
      "--color-body-bg": "#FFF",
      "--color-body-text": "#000",
      "--color-footer-bg": "#000",
      "--color-footer-text": "#FFF",
      "--color-splash-bg": "#000",
      "--color-splash-text": "#FFF",
      "--color-muted": "#696969",
      "--color-field-border": "#EDEDED",
      "--color-placeholder": "#696969",
      "--color-focus": "#00075F",
      "--color-media-bg": "#F7F7F7",
      "--color-substrate": "#F7F7F7",
      "--color-button-bg": "#00075F",
      "--color-button-text": "#FFF",
      "--color-button-hover-bg": "#141b6c",
      "--color-button-hover-text": "#FFF",
      "--brand-image-filter": "none",
      "--brand-footer-filter": "none"
    }
  },
  {
    "name": "Are.na Dark",
    "tokens": {
      "--color-body-bg": "#000",
      "--color-body-text": "#FFF",
      "--color-footer-bg": "#FFF",
      "--color-footer-text": "#000",
      "--color-splash-bg": "#FFF",
      "--color-splash-text": "#000",
      "--color-muted": "#B2B2B2",
      "--color-field-border": "#333333",
      "--color-placeholder": "#B2B2B2",
      "--color-focus": "#E2DFE9",
      "--color-media-bg": "#1A1A1A",
      "--color-substrate": "#1A1A1A",
      "--color-button-bg": "#E2DFE9",
      "--color-button-text": "#000",
      "--color-button-hover-bg": "#d0cdd6",
      "--color-button-hover-text": "#000",
      "--brand-image-filter": "invert(1)",
      "--brand-footer-filter": "invert(1)"
    }
  },
  {
    "name": "Are.na Dawn",
    "tokens": {
      "--color-body-bg": "#F5F1F0",
      "--color-body-text": "#342C2A",
      "--color-footer-bg": "#342C2A",
      "--color-footer-text": "#F5F1F0",
      "--color-splash-bg": "#342C2A",
      "--color-splash-text": "#F5F1F0",
      "--color-muted": "#7F7977",
      "--color-field-border": "#E0DBDA",
      "--color-placeholder": "#7F7977",
      "--color-focus": "#00075F",
      "--color-media-bg": "#EAE6E5",
      "--color-substrate": "#EAE6E5",
      "--color-button-bg": "#00075F",
      "--color-button-text": "#F5F1F0",
      "--color-button-hover-bg": "#141a6b",
      "--color-button-hover-text": "#F5F1F0",
      "--brand-image-filter": "none",
      "--brand-footer-filter": "none"
    }
  },
  {
    "name": "Are.na Dusk",
    "tokens": {
      "--color-body-bg": "#16171E",
      "--color-body-text": "#E7DBF0",
      "--color-footer-bg": "#E7DBF0",
      "--color-footer-text": "#16171E",
      "--color-splash-bg": "#E7DBF0",
      "--color-splash-text": "#16171E",
      "--color-muted": "#A798B3",
      "--color-field-border": "#342E38",
      "--color-placeholder": "#A798B3",
      "--color-focus": "#C1C4EA",
      "--color-media-bg": "#24222C",
      "--color-substrate": "#24222C",
      "--color-button-bg": "#C1C4EA",
      "--color-button-text": "#16171E",
      "--color-button-hover-bg": "#b3b6da",
      "--color-button-hover-text": "#16171E",
      "--brand-image-filter": "invert(1)",
      "--brand-footer-filter": "invert(1)"
    }
  }
];
export const typographyPresets: StylePreset[] = [{ name: "Are.na · Areal", tokens: {
  "--font-body": "Areal, Arial, Helvetica, sans-serif", "--font-display": "Areal, Arial, Helvetica, sans-serif", "--font-lead": "Areal, Arial, Helvetica, sans-serif",
  "--line-height-body": "1.56", "--line-height-title": "1.08", "--line-height-intro": "1.2",
  "--font-weight-regular": "400", "--font-weight-strong": "700",
}}];
export function isTypographyToken(key: string) { return /^--(?:font-|line-height-|letter-spacing-)/.test(key); }
export function isColorToken(key: string) { return key.startsWith("--color-") || key.includes("filter"); }
export function applyStylePreset(current: ThemeTokens, initial: ThemeTokens, preset: StylePreset | null, category: "color" | "typography"): ThemeTokens {
  const matches = category === "color" ? isColorToken : isTypographyToken;
  const next = { ...current };
  for (const key of Object.keys(initial) as (keyof ThemeTokens)[]) if (matches(key)) next[key] = initial[key];
  return { ...next, ...preset?.tokens };
}
export function selectedStylePreset(current: ThemeTokens, initial: ThemeTokens, presets: StylePreset[], category: "color" | "typography"): string {
  const matches = category === "color" ? isColorToken : isTypographyToken;
  const keys = (Object.keys(initial) as (keyof ThemeTokens)[]).filter(matches);
  for (const [index, preset] of [null, ...presets].entries()) {
    const expected = applyStylePreset(current, initial, preset, category);
    if (keys.every(key => current[key].toLowerCase() === expected[key].toLowerCase())) return index === 0 ? "original" : String(index - 1);
  }
  return "custom";
}
