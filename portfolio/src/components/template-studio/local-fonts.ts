export type LocalFont = {family:string;name:string;fileName:string;weight:string;style:"normal"|"italic";bytes:ArrayBuffer};
export type PackedFont = Omit<LocalFont,"bytes"> & {data:string};
const MAX_BYTES=10*1024*1024;
const registered=new Map<string,FontFace>();
export function fontFormat(bytes:ArrayBuffer) {
  const view=new DataView(bytes);if(bytes.byteLength<12)throw new Error("This file is not a supported font.");
  const tag=String.fromCharCode(...new Uint8Array(bytes,0,4));
  if(tag==="wOF2")return "woff2";if(tag==="wOFF")return "woff";if(tag==="OTTO")return "opentype";if(view.getUint32(0)===0x00010000||tag==="true")return "truetype";
  throw new Error("Choose a WOFF2, WOFF, TTF or OTF font file.");
}
async function identity(bytes:ArrayBuffer) { const hash=await crypto.subtle.digest("SHA-256",bytes);return "StudioFont_"+[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,"0")).join("").slice(0,32); }
export async function makeLocalFont(file:File):Promise<LocalFont> {
  if(file.size>MAX_BYTES)throw new Error("Choose a font smaller than 10 MB.");
  const bytes=await file.arrayBuffer();fontFormat(bytes);
  return {family:await identity(bytes),name:file.name.replace(/\.(woff2?|ttf|otf)$/i,"").replace(/[^\p{L}\p{N} ._-]/gu,"").slice(0,80)||"Custom font",fileName:file.name.replace(/[^\p{L}\p{N} ._-]/gu,"").slice(0,100),weight:"400",style:"normal",bytes};
}
export async function registerLocalFont(font:LocalFont) {
  fontFormat(font.bytes);
  if(!/^StudioFont_[a-f0-9]{32}$/.test(font.family)||font.bytes.byteLength>MAX_BYTES)throw new Error("Invalid custom font.");
  if(!/^(?:[1-9]00|100 900)$/.test(font.weight)||!["normal","italic"].includes(font.style))throw new Error("Unsupported font face descriptor.");
  const key=font.family+":"+font.weight+":"+font.style;if(registered.has(key))return;
  const face=await new FontFace(font.family,font.bytes,{weight:font.weight,style:font.style,display:"swap"}).load();
  for(const [oldKey,old]of registered)if(old.family===font.family){document.fonts.delete(old);registered.delete(oldKey);}
  document.fonts.add(face);registered.set(key,face);
}
function openLibrary(siteId:string):Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{const request=indexedDB.open("template-fonts:"+siteId,1);request.onupgradeneeded=()=>request.result.createObjectStore("fonts",{keyPath:"family"});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
}
export async function savedLocalFonts(siteId:string):Promise<LocalFont[]> {
  const db=await openLibrary(siteId);try{return await new Promise((resolve,reject)=>{const request=db.transaction("fonts").objectStore("fonts").getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}
}
export async function saveLocalFonts(siteId:string,fonts:LocalFont[]) {
  const db=await openLibrary(siteId);try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction("fonts","readwrite");for(const font of fonts)tx.objectStore("fonts").put(font);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}
}
export async function deleteLocalFont(siteId:string,family:string) {
  const db=await openLibrary(siteId);try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction("fonts","readwrite");tx.objectStore("fonts").delete(family);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{db.close();}
}
function base64(bytes:ArrayBuffer) {let text="";const data=new Uint8Array(bytes);for(let i=0;i<data.length;i+=8192)text+=String.fromCharCode(...data.subarray(i,i+8192));return btoa(text);}
export function packFonts(fonts:LocalFont[],tokens:Record<string,string>):PackedFont[] {const used=Object.values(tokens).join(" ");return fonts.filter(font=>used.includes(font.family)).map(({bytes,...font})=>({...font,data:base64(bytes)}));}
export async function unpackFonts(value:unknown):Promise<LocalFont[]> {
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>16)throw new Error("Invalid font bundle.");
  const fonts:LocalFont[]=[];
  for(const entry of value){
    if(!entry||typeof entry!=="object"||typeof entry.data!=="string"||entry.data.length>MAX_BYTES*1.4||!/^[A-Za-z0-9+/]*={0,2}$/.test(entry.data))throw new Error("Invalid bundled font.");
    const raw=atob(entry.data),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    if(await identity(bytes.buffer)!==entry.family)throw new Error("Bundled font identity does not match its file.");
    const font:LocalFont={family:entry.family,name:String(entry.name??"Custom font").slice(0,80),fileName:String(entry.fileName??"font").slice(0,100),weight:entry.weight??"400",style:entry.style??"normal",bytes:bytes.buffer};
    await registerLocalFont(font);fonts.push(font);
  }return fonts;
}
export function fontCss(fonts:LocalFont[],tokens:Record<string,string>) {return packFonts(fonts,tokens).map(font=>`@font-face { font-family: "${font.family}"; src: url("data:font/${fontFormat(fonts.find(item=>item.family===font.family)!.bytes)};base64,${font.data}"); font-weight: ${font.weight}; font-style: ${font.style}; font-display: swap; }`).join("\n")+"\n";}
export function fontStack(font:LocalFont) {return `"${font.family}", sans-serif`;}
