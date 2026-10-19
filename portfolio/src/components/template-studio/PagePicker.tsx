"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { findStyleTarget, type StyleTarget } from "./style-targets";
import type { StudioDevice } from "./device-model";
import styles from "./studio.module.css";
export type StylePick={section:string;related:string[];label:string;keys?:string[];fieldKeys?:Record<string,string[]>;request:number;context:string};
export const PICKER_CSS=`[data-studio-hovered] { outline:2px dashed #58c9ef !important; outline-offset:3px !important; cursor:crosshair !important; } [data-studio-selected] { outline:2px solid #e629bc !important; outline-offset:3px !important; }`;
type Props={enabled:boolean;device:StudioDevice;context:string;frame?:RefObject<HTMLIFrameElement|null>;onPick:(pick:StylePick)=>void;onStop:()=>void};
export function PagePicker({enabled,device,context,frame,onPick,onStop}:Props) {
  const [hint,setHint]=useState<{label:string;x:number;y:number}|null>(null);
  const callbacks=useRef({onPick,onStop});
  useEffect(()=>{callbacks.current={onPick,onStop};},[onPick,onStop]);
  const request=useRef(0);
  useEffect(()=>{
    if(!enabled)return;
    let hovered:Element|null=null,selected:Element|null=null,childCleanup:(()=>void)|undefined;
    const cleanHover=()=>{hovered?.removeAttribute('data-studio-hovered');hovered=null;setHint(null);};
    function target(event:MouseEvent|PointerEvent):StyleTarget|null {
      const node=event.target as Element|null;return node?.nodeType===1?findStyleTarget(node,device):null;
    }
    function attach(doc:Document){
      const win=doc.defaultView;if(!win)return()=>{};
      function move(event:PointerEvent){
        const match=target(event);if(!match){cleanHover();return;}
        if(hovered!==match.element){hovered?.removeAttribute('data-studio-hovered');hovered=match.element;if(hovered!==selected)hovered.setAttribute('data-studio-hovered','');}
        const box=doc===document?null:frame?.current?.getBoundingClientRect();
        const scale=box&&frame?.current?box.width/frame.current.clientWidth:1;
        setHint({label:match.label,x:Math.min(innerWidth-230,(box?.left??0)+event.clientX*scale+14),y:Math.min(innerHeight-50,(box?.top??0)+event.clientY*scale+18)});
      }
      function down(event:PointerEvent){if(event.button===0&&target(event)){event.preventDefault();event.stopImmediatePropagation();}}
      function click(event:MouseEvent){
        if(event.button!==0)return;const match=target(event);if(!match)return;
        event.preventDefault();event.stopImmediatePropagation();
        selected?.removeAttribute('data-studio-selected');selected=match.element;selected.setAttribute('data-studio-selected','');cleanHover();
        callbacks.current.onPick({section:match.section,related:match.related,label:match.label,keys:match.keys,fieldKeys:match.fieldKeys,request:++request.current,context});
      }
      function escape(event:KeyboardEvent){if(event.key==='Escape'){cleanHover();callbacks.current.onStop();}}
      win.addEventListener('pointermove',move,true);win.addEventListener('pointerleave',cleanHover);win.addEventListener('pointerdown',down,true);win.addEventListener('click',click,true);doc.addEventListener('keydown',escape,true);
      return()=>{win.removeEventListener('pointermove',move,true);win.removeEventListener('pointerleave',cleanHover);win.removeEventListener('pointerdown',down,true);win.removeEventListener('click',click,true);doc.removeEventListener('keydown',escape,true);doc.querySelectorAll('[data-studio-hovered],[data-studio-selected]').forEach(element=>{element.removeAttribute('data-studio-hovered');element.removeAttribute('data-studio-selected');});};
    }
    const mainCleanup=attach(document),iframe=frame?.current;
    function attachFrame(){childCleanup?.();if(iframe?.contentDocument)childCleanup=attach(iframe.contentDocument);}
    attachFrame();iframe?.addEventListener('load',attachFrame);
    return()=>{mainCleanup();childCleanup?.();iframe?.removeEventListener('load',attachFrame);hovered?.removeAttribute('data-studio-hovered');selected?.removeAttribute('data-studio-selected');};
  },[enabled,device,context,frame]);
  return <><style>{PICKER_CSS}</style>{enabled&&hint?<output data-template-studio-ui className={styles.pickerHint} style={{left:Math.max(8,hint.x),top:Math.max(8,hint.y)}}>{hint.label}</output>:null}</>;
}
