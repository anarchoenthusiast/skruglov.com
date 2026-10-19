"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import type { ThemeTokens } from "@/theme/presets";
import { registerLocalFont, type LocalFont } from "./local-fonts";
import { validateTokens } from "./schema";
import type { StudioDevice } from "./device-model";
import styles from "./studio.module.css";
import { PICKER_CSS } from "./PagePicker";
export const PREVIEW_QUERY="studio-preview";
export const THEME_EVENT="template-studio-theme";
export function DevicePreview({device,path,width,fonts,tokens,frame}: {device:StudioDevice;path:string;width:number;fonts:LocalFont[];tokens:ThemeTokens;frame:RefObject<HTMLIFrameElement|null>}) {
  const router=useRouter(),host=useRef<HTMLDivElement>(null);
  const [box,setBox]=useState({width:width,height:800});
  useEffect(()=>{
    const background=Array.from(document.body.children).filter((node):node is HTMLElement=>node instanceof HTMLElement&&!node.matches('[data-template-studio-ui],.dialkit-root,script,style,link,nextjs-portal')).map(element=>({element,inert:element.inert}));
    for(const {element}of background)element.inert=true;
    return()=>{for(const {element,inert}of background)element.inert=inert;};
  },[path]);
  useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(([entry])=>setBox({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(host.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    function sync(){const style=getComputedStyle(document.documentElement);frame.current?.contentWindow?.postMessage({type:"template-studio:theme",tokens:Object.fromEntries(Object.keys(tokens).map(key=>[key,style.getPropertyValue(key).trim()])),fonts},location.origin);}
    function receive(event:MessageEvent){if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;if(event.data?.type==="template-studio:ready")sync();if(event.data?.type==="template-studio:navigate"&&typeof event.data.path==="string"){const url=new URL(event.data.path,location.origin);if(url.origin===location.origin)router.push(url.pathname+url.search+url.hash);}}
    window.addEventListener(THEME_EVENT,sync);window.addEventListener("message",receive);sync();return()=>{window.removeEventListener(THEME_EVENT,sync);window.removeEventListener("message",receive);};
  },[fonts,tokens,frame,router,path]);
  const scale=Math.min(1,box.width/width),height=Math.max(200,Math.floor(box.height/Math.max(scale,0.1)));
  return <div data-template-studio-ui className={styles.previewBackdrop}>
    <div className={styles.previewLabel}>{device==="mobile"?"Mobile":"Desktop"} preview · {width}px</div>
    <div ref={host} className={styles.previewStage}>
      <div style={{width:width*scale,height:height*scale}} className={styles.previewFrame}>
        <iframe ref={frame} title={`${device==="mobile"?"Mobile":"Desktop"} site preview`} src={`${path}?${PREVIEW_QUERY}=1`} style={{width,height,transform:`scale(${scale})`}}/>
      </div>
    </div>
  </div>;
}
/** Runs only inside the same-origin preview; no editor or persistence is mounted here. */
export function PreviewBridge({initialTokens}:{initialTokens:ThemeTokens}) {
  useEffect(()=>{
    let revision=0;
    async function receive(event:MessageEvent){
      if(event.origin!==location.origin||event.source!==parent||event.data?.type!=="template-studio:theme")return;
      const current=++revision;
      try{const tokens=validateTokens(event.data.tokens,initialTokens);for(const font of event.data.fonts??[])await registerLocalFont(font);if(current!==revision)return;for(const [key,value]of Object.entries(tokens))document.documentElement.style.setProperty(key,value,"important");document.documentElement.dataset.studioPreviewReady="true";}catch(error){console.error("Preview theme:",error);}
    }
    function navigate(event:MouseEvent){const target=(event.target as Element).closest('a[href]') as HTMLAnchorElement|null;if(!target||target.closest("[data-media-item]")||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||target.target==="_blank"||target.hasAttribute("download"))return;const url=new URL(target.href);if(url.origin!==location.origin||url.pathname===location.pathname&&!url.search)return;event.preventDefault();url.searchParams.delete(PREVIEW_QUERY);parent.postMessage({type:"template-studio:navigate",path:url.pathname+url.search+url.hash},location.origin);}
    window.addEventListener("message",receive);document.addEventListener("click",navigate,true);parent.postMessage({type:"template-studio:ready"},location.origin);
    return()=>{revision++;window.removeEventListener("message",receive);document.removeEventListener("click",navigate,true);};
  },[initialTokens]);
  return <style>{PICKER_CSS+`[data-studio-affected] { outline: 2px solid #e629bc !important; outline-offset: 2px !important; } html[data-template-studio-probing] body, html[data-template-studio-probing] body * { transition: none !important; }`}</style>;
}
