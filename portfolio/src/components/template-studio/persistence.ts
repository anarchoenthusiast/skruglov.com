import type { ThemeTokens } from "@/theme/presets";
import { controlPath, fluidFields, tokenControls, tokenProperty, valuesFromTokens, type TokenKey } from "./schema";

const oldLabels: Record<string,string> = {
  "--font-body":"Body font","--font-display":"Display font",
  "--font-size-body":"Body size","--font-size-body-mobile":"Body size · mobile",
  "--font-size-small":"Small text","--font-size-title":"Title size","--font-size-title-mobile":"Title size · mobile",
  "--font-size-intro":"Intro size","--font-size-intro-mobile":"Intro size · mobile","--font-size-navigation-mobile":"Navigation size · mobile",
};
function oldPath(key:string) {
  const property=tokenProperty(key as TokenKey);
  const group=property==="color"?"Colors":/font|line-height|letter-spacing/.test(property)?"Typography":/radius|filter|opacity|border|focus|motion/.test(key)?"Shape":/control|field|button|textarea|status/.test(key)?"Controls":/max|header-height/.test(key)?"Layout":"Spacing";
  return group+"."+(oldLabels[key]??key.replace(/^--(?:color-)?/,"").split("-").map(word=>word[0].toUpperCase()+word.slice(1)).join(" "));
}
/** Migrate saved controls and every named version before DialKit hydrates them. */
export function migrateStudioValues(values: Record<string,unknown> | undefined, initial:ThemeTokens) {
  if(!values || Object.keys(values).some(key=>key.startsWith("Typography.Titles.")))return values;
  if(!Object.keys(values).some(key=> /^(Typography|Spacing|Controls|Shape|Layout|Colors)\./.test(key)))return values;
  const controls=tokenControls(initial),defaults=valuesFromTokens(initial,controls);
  const result:Record<string,unknown>={};
  for(const [key,value]of Object.entries(values))if(/^(Coverage|Colors\.Preset|Typography\.Preset)/.test(key))result[key]=value;
  for(const control of controls){
    const oldKey=control.key==="--font-lead"?"--font-display":control.key==="--font-display"?"--font-body":control.key==="--font-weight-regular"?"--font-weight-body":control.key;
    let from=oldPath(oldKey);const to=controlPath(control).join(".");
    if(control.key==="--font-size-navigation-mobile" && !(from+".Mode" in values) && !(from in values))from="Typography.Font Size Navigation Mobile";
    if(control.type==="fluid"){
      let parsed=defaults;
      if(typeof values[from]==="string") parsed=valuesFromTokens({...initial,[control.key]:values[from]},[control]);
      for(const [part,label]of Object.entries(fluidFields))result[to+"."+label]=values[from+"."+label]??parsed[control.key+":"+part];
    }else result[to]=values[from]??defaults[control.key];
  }
  return result;
}
export function migrateStoredStudio(key:string,initial:ThemeTokens) {
  try {
    const raw=localStorage.getItem(key);if(!raw)return;
    const state=JSON.parse(raw);let changed=false;
    function migrate(values:Record<string,unknown>|undefined){const next=migrateStudioValues(values,initial);if(next!==values)changed=true;return next;}
    state.values=migrate(state.values);state.baseValues=migrate(state.baseValues);
    if(Array.isArray(state.presets))for(const preset of state.presets)preset.values=migrate(preset.values);
    if(changed){if(!localStorage.getItem(key+":before-semantic-roles"))localStorage.setItem(key+":before-semantic-roles",raw);localStorage.setItem(key,JSON.stringify(state));}
  }catch { /* Keep the original stored data intact if a legacy value is unsupported. */ }
}
