import type { ControlMeta } from "dialkit";
import type { TokenControl, StudioValues } from "./schema";
import { controlPath } from "./schema";
export type StudioDevice = "desktop" | "mobile";
const mobile = new Set(["--font-size-title-mobile","--font-size-intro-mobile","--font-size-body-mobile","--font-size-navigation-mobile","--page-gutter-mobile","--section-space-mobile","--grid-gap-mobile","--header-height-mobile","--nav-gap-mobile","--footer-padding-top-mobile","--footer-padding-bottom-mobile","--space-2","--space-6"]);
const desktop = new Set(["--font-size-title","--font-size-intro","--font-size-body","--page-gutter-desktop","--section-space-desktop","--grid-gap","--header-height","--nav-gap","--footer-padding-top","--footer-padding-bottom","--space-10","--page-title-space","--page-content-space"]);
export function controlDevice(control:TokenControl):StudioDevice | "shared" {return mobile.has(control.key)?"mobile":desktop.has(control.key)?"desktop":"shared";}
export function visibleControls(meta:ControlMeta[],controls:TokenControl[],device:StudioDevice):ControlMeta[] {
  const map=new Map(controls.map(control=>[controlPath(control).join("."),control]));
  return meta.flatMap(item=>{
    const token=map.get(item.path);
    if(token && ![device,"shared"].includes(controlDevice(token)))return [];
    const label=item.label.replace(/ · (?:desktop|mobile)/g,"").replace(/^Mobile size$/,"Size");
    if(item.type!=="folder"||token)return [{...item,label:token?.key.includes("font-size")?"Size (px)":label}];
    const children=visibleControls(item.children??[],controls,device);
    if(!children.some(child=>!child.path.endsWith(".Inspect")))return [];
    return [{...item,label,children}];
  });
}
export function displayedSize(values:StudioValues,key:string,width:number) {
  if(values[key+":mode"]==="fixed")return Number(values[key+":fixed"]);
  return Math.min(Number(values[key+":max"]),Math.max(Number(values[key+":min"]),Number(values[key+":vw"])*width/100));
}
/** Scale an adaptive range as a unit, so the primary size slider has immediate visible feedback. */
export function resizedValues(values:StudioValues,key:string,width:number,size:number):StudioValues {
  if(!Number.isFinite(size)||size<1||size>400)throw new Error("Choose a size from 1 to 400 px.");
  if(values[key+":mode"]==="fixed")return {...values,[key+":fixed"]:size};
  const ratio=size/Math.max(displayedSize(values,key,width),0.01),next={...values};
  for(const part of ["min","vw","max"])next[key+":"+part]=Number((Number(values[key+":"+part])*ratio).toFixed(part==="vw"?4:2));
  return next;
}
