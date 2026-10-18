import { themes, type ThemeTokens } from "@/theme/presets";
import { meaningFor } from "./control-model";
import { typographyPresets } from "@/theme/style-presets";

export type TokenKey = keyof ThemeTokens;
export type StudioValues = Record<string, string | number>;
export type TokenControl = { key: TokenKey; label: string; group: string; section: string; type: "color" | "number" | "font" | "fluid" | "filter"; unit: string; min: number; max: number; step: number };
const dimension = /^(-?[\d.]+)(px|em|rem|ch|s)?$/;
export function parseFluid(value: string) {
  const match = value.match(/^clamp\(\s*([\d.]+)px,\s*([\d.]+)vw,\s*([\d.]+)px\s*\)$/);
  return match ? { min: Number(match[1]), vw: Number(match[2]), max: Number(match[3]) } : null;
}
export function tokenProperty(key: TokenKey): string {
  if (key.startsWith("--color-")) return "color";
  if (["--font-body", "--font-display", "--font-lead"].includes(key)) return "font-family";
  if (key.includes("font-weight")) return "font-weight";
  if (key.includes("font-size")) return "font-size";
  if (key.includes("line-height")) return "line-height";
  if (key.includes("letter-spacing")) return "letter-spacing";
  if (key.includes("opacity")) return "opacity";
  if (key.startsWith("--motion-")) return "transition-duration";
  if (key.endsWith("-scale")) return "flex-grow";
  if (key.includes("radius")) return "border-radius";
  if (key.includes("filter")) return "filter";
  return "margin-left";
}
export function tokenControls(tokens: ThemeTokens): TokenControl[] {
  return (Object.keys(tokens) as TokenKey[]).map((key): TokenControl => {
    const value = tokens[key], numeric = value.match(dimension), property = tokenProperty(key);
    const type = property === "color" ? "color" : property === "font-family" ? "font" : property === "filter" ? "filter" : parseFluid(value) ? "fluid" : numeric ? "number" : null;
    if (!type) throw new Error(`No numeric editor for ${key}: ${value}`);
    const unit = numeric?.[2] ?? "";
    return { key, ...meaningFor(key), type, unit,
      min: property === "letter-spacing" ? -0.2 : property === "line-height" ? 0.5 : property === "font-weight" ? 100 : 0,
      max: property === "font-weight" ? 900 : property === "line-height" || key.endsWith("-scale") ? 3 : property === "opacity" ? 1 : unit === "s" ? 2 : ["em", "rem", "ch"].includes(unit) ? 12 : key.includes("max") ? 2000 : 400,
      step: key === "--button-inset-x" ? 0.03125 : property === "font-weight" ? 100 : property === "letter-spacing" ? 0.001 : property === "line-height" ? 0.0001 : property === "opacity" || unit === "s" ? 0.01 : ["em", "rem", "ch"].includes(unit) || key.endsWith("-scale") ? 0.0125 : 1,
    };
  }).sort((a,b) => {
    const groups=["Typography","Colors","Layout","Components","Advanced"];
    const sections=["Titles","Lead paragraphs","Body & interface","Notes & credits","Navigation","Details","Page","Case studies","Header","Footer","Page details","Form","Media","Project tabs","Focus & motion","Splash","Fields & focus","Buttons","Media defaults","Shared spacing"];
    const fieldRank=(control:TokenControl)=>control.type==="font"?0:control.key.includes("font-size")?1:control.key.includes("line-height")?2:control.key.includes("letter-spacing")?3:4;
    return groups.indexOf(a.group)-groups.indexOf(b.group)||sections.indexOf(a.section)-sections.indexOf(b.section)||fieldRank(a)-fieldRank(b);
  });
}
export function valuesFromTokens(tokens: ThemeTokens, controls: TokenControl[]): StudioValues {
  const values: StudioValues = {};
  for (const control of controls) {
    const value = tokens[control.key];
    if (control.type === "fluid") {
      const fluid = parseFluid(value), fallback = parseFluid(themes.brightfutures[control.key])!;
      if (!fluid && !/^\d+(?:\.\d+)?px$/.test(value)) throw new Error(`${control.label}: use a pixel size or clamp(min px, viewport vw, max px).`);
      const range = fluid ?? fallback;
      values[control.key + ":mode"] = fluid ? "fluid" : "fixed";
      values[control.key + ":fixed"] = fluid ? Math.round(Math.min(fluid.max, Math.max(fluid.min, fluid.vw * 14.4)) * 100) / 100 : parseFloat(value);
      for (const part of ["min", "vw", "max"] as const) values[control.key + ":" + part] = range[part];
    } else values[control.key] = control.type === "number" ? parseFloat(value) : value;
  }
  return values;
}
export function validateTokens(candidate: unknown, baseline: ThemeTokens): ThemeTokens {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Expected a token object.");
  const result = { ...baseline };
  for (const [key, value] of Object.entries(candidate)) {
    if (!Object.hasOwn(baseline, key)) throw new Error(`Unknown token: ${key}`);
    if (typeof value !== "string" || value.length > 250 || /[;{}<>\\]|url\s*\(/i.test(value)) throw new Error(`Invalid value for ${key}`);
    if (key.startsWith("--color-") && !/^(#[\da-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\([\da-z.%+\-\s,/]+\))$/i.test(value)) throw new Error(`Invalid color: ${key}`);
    if (["--font-body", "--font-display", "--font-lead"].includes(key) && !/^[\p{L}\p{N}\s'",._-]+$/u.test(value)) throw new Error(`Invalid font: ${key}`);
    if (key.includes("filter") && !["none", "invert(1)"].includes(value)) throw new Error("Choose a supported logo filter.");
    result[key as TokenKey] = value;
  }
  return result;
}
function number(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(`Invalid ${label}`);
  return value;
}
export function tokensFromValues(values: StudioValues, controls: TokenControl[], baseline: ThemeTokens): ThemeTokens {
  const tokens: Partial<ThemeTokens> = {};
  for (const control of controls) {
    const value = values[control.key];
    if (control.type === "fluid") {
      const get = (part: string, max: number) => number(values[control.key + ":" + part], `${control.label} ${part}`, 0, max);
      const mode = values[control.key + ":mode"];
      if (mode === "fixed") tokens[control.key] = `${get("fixed", 1600)}px`;
      else if (mode === "fluid") {
        const min = get("min", 1600), vw = get("vw", 100), max = get("max", 1600);
        if (min > max) throw new Error(`${control.label}: minimum must not exceed maximum.`);
        tokens[control.key] = `clamp(${min}px, ${vw}vw, ${max}px)`;
      } else throw new Error(`Invalid sizing mode for ${control.label}`);
    } else {
      if (control.type === "number") number(value, control.label, control.min, control.max);
      tokens[control.key] = `${value}${control.type === "number" ? control.unit : ""}`;
    }
  }
  return validateTokens(tokens, baseline);
}
export function fontOptions(key: TokenKey, current: string, custom: {value:string;label:string}[] = []) {
  const values = [current, ...Object.values(themes).map((theme) => theme[key]), ...typographyPresets.map((preset) => preset.tokens[key]), "Arial, sans-serif", "Georgia, serif", "system-ui, sans-serif", "monospace"].filter((value): value is string => Boolean(value));
  return [...new Set(values)].map((value) => ({ value, label: value.startsWith("Areal,") ? "Are.na · Areal" : value })).concat(custom).concat([{value:"__upload_font__",label:"Custom font · Choose file…"}]);
}
export function themeCss(tokens: ThemeTokens): string {
  return `:root {\n${Object.entries(tokens).map(([key, value]) => `  ${key}: ${value} !important;`).join("\n")}\n}\n`;
}
export type CoverageReport = {
  tokens: { key: string; uses: number; files: string[] }[];
  declarations: { total: number; tokenized: number; percentage: number };
  gaps: { file: string; line: number; property: string; value: string }[];
  exclusions: string[];
};
export function controlPath(control: TokenControl) {return [control.group,control.section,control.label];}
export const fluidFields={mode:"Mode",fixed:"Fixed px",min:"Minimum px",vw:"Viewport vw",max:"Maximum px"};
export function normalizedTheme(candidate:unknown,baseline:ThemeTokens,legacy=false):ThemeTokens {
  if(!candidate||typeof candidate!=="object"||Array.isArray(candidate))throw new Error("Expected theme tokens.");
  const input={...candidate} as Record<string,unknown>;
  if(legacy&&!Object.hasOwn(input,"--font-lead")){
    if(input["--font-display"]!==undefined)input["--font-lead"]=input["--font-display"];
    input["--font-display"]=input["--font-body"]??baseline["--font-display"];
  }
  const aliases:Record<string,string>={"--font-weight-body":"--font-weight-regular","--font-weight-display":"--font-weight-regular","--font-weight-title":"--font-weight-regular","--space-9":"--space-8","--space-11":"--section-space-desktop"};
  for(const [old,key]of Object.entries(aliases)){if(input[key]===undefined&&input[old]!==undefined)input[key]=input[old];delete input[old];}
  for(const old of ["--font-size-legal","--font-size-legal-title","--line-height-base","--line-height-legal","--line-height-legal-title","--letter-spacing-legal-title","--font-size-language","--font-size-small-mobile"])delete input[old];
  return validateTokens(input,baseline);
}
