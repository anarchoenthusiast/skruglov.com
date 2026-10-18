"use client";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type KeyboardEvent, type RefObject } from "react";
type Position={x:number;y:number};
/** Keep the custom filtered host draggable while retaining DialKit's Folder controls. */
export function usePanelDrag(host:RefObject<HTMLDivElement|null>,id:string) {
  const [position,setPosition]=useState<Position|null>(null);
  const drag=useRef<{x:number;y:number;left:number;top:number;target:HTMLElement;moved:boolean}|null>(null);
  const blockClick=useRef(false);
  const storage=`template-studio-panel:${id}`;
  function clamp(next:Position){const rect=host.current?.getBoundingClientRect();return {x:Math.max(8,Math.min(next.x,innerWidth-(rect?.width??280)-8)),y:Math.max(8,Math.min(next.y,innerHeight-Math.min(rect?.height??42,innerHeight-16)-8))};}
  useEffect(()=>{
    const fit=()=>setPosition(old=>old?clamp(old):old);
    const observer=new ResizeObserver(fit);
    const task=requestAnimationFrame(()=>{
      if(host.current)observer.observe(host.current);
      try{const saved=JSON.parse(sessionStorage.getItem(storage)??'null');if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))setPosition(clamp(saved));}catch{}
    });
    window.addEventListener('resize',fit);
    return()=>{cancelAnimationFrame(task);observer.disconnect();window.removeEventListener('resize',fit);delete document.documentElement.dataset.studioDragging;};
  // Refs and viewport measurements only; position changes must not resubscribe the observer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[storage,host]);
  function down(event:PointerEvent<HTMLDivElement>){
    if(event.button!==0)return;
    const target=event.target as HTMLElement,header=target.closest<HTMLElement>('.dialkit-panel-header');
    const handle=target.closest<HTMLElement>('[data-studio-drag-handle]');
    if(!handle&&(!header||target.closest('button,input,select,textarea,a,.dialkit-panel-toolbar,.dialkit-panel-icon')))return;
    const rect=host.current!.getBoundingClientRect(),capture=handle??header!;
    drag.current={x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,target:capture,moved:false};
    blockClick.current=false;capture.setPointerCapture(event.pointerId);
  }
  function move(event:PointerEvent<HTMLDivElement>){
    const start=drag.current;if(!start)return;
    if(!start.moved&&Math.hypot(event.clientX-start.x,event.clientY-start.y)<8)return;
    start.moved=true;blockClick.current=true;event.preventDefault();document.documentElement.dataset.studioDragging='true';
    setPosition(clamp({x:start.left+event.clientX-start.x,y:start.top+event.clientY-start.y}));
  }
  function up(event:PointerEvent<HTMLDivElement>){
    const start=drag.current;if(!start)return;
    if(start.target.hasPointerCapture(event.pointerId))start.target.releasePointerCapture(event.pointerId);
    if(start.moved){event.preventDefault();event.stopPropagation();const rect=host.current!.getBoundingClientRect();try{sessionStorage.setItem(storage,JSON.stringify({x:rect.left,y:rect.top}));}catch{}}
    if(event.type==='pointercancel')blockClick.current=false;
    drag.current=null;delete document.documentElement.dataset.studioDragging;
  }
  function reset(){setPosition(null);try{sessionStorage.removeItem(storage);}catch{}}
  function onHandleKeyDown(event:KeyboardEvent<HTMLButtonElement>){
    if(event.key==='Home'){event.preventDefault();reset();return;}
    const axes:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},axis=axes[event.key];
    if(!axis||!host.current)return;event.preventDefault();
    const rect=host.current.getBoundingClientRect(),step=event.shiftKey?60:20,next=clamp({x:rect.left+axis[0]*step,y:rect.top+axis[1]*step});
    setPosition(next);try{sessionStorage.setItem(storage,JSON.stringify(next));}catch{}
  }
  const style:CSSProperties|undefined=position?{top:position.y,left:position.x,right:'auto',bottom:'auto',maxHeight:`calc(100dvh - ${position.y+8}px)`}:undefined;
  return {reset,onHandleKeyDown,style,onPointerDownCapture:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up,onClickCapture:(event:React.MouseEvent)=>{if(blockClick.current){event.preventDefault();event.stopPropagation();blockClick.current=false;}}};
}
