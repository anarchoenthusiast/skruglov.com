"use client";
import { useEffect, useReducer, useRef, useState, type RefObject } from "react";
import { ButtonGroup, ControlRenderer, DialStore, Folder, PresetManager, Slider, type ControlMeta } from "dialkit";
import { controlPath, type StudioValues, type TokenControl } from "./schema";
import { displayedSize, resizedValues, visibleControls, type StudioDevice } from "./device-model";
import { PagePicker, type StylePick } from "./PagePicker";
import { usePanelDrag } from "./use-panel-drag";
import styles from "./studio.module.css";

type Props={id:string;controls:TokenControl[];values:StudioValues;device:StudioDevice;width:number;onDevice:(device:StudioDevice)=>void;onSize:(values:StudioValues)=>void;route:string;frame?:RefObject<HTMLIFrameElement|null>};
export function StudioPanel({id,controls,values,device,width,onDevice,onSize,route,frame}:Props) {
  const [mode,setMode]=useState<'all'|'layer'>('all');
  const [selection,setSelection]=useState<StylePick|null>(null);
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const panelHost=useRef<HTMLDivElement>(null);
  const {reset:resetPosition,onHandleKeyDown,...dragging}=usePanelDrag(panelHost,id);
  function chooseMode(next:'all'|'layer'){setMode(next);if(next==='all')setSelection(null);}
  const panelOpen=DialStore.isPanelOpen(id);
  const context=`${route}:${device}:${Boolean(frame)}`;
  const selected=mode==='layer'&&selection?.context===context?selection:null;
  const [,refresh]=useReducer(n=>n+1,0);
  useEffect(()=>{const unsubscribe=DialStore.subscribe(id,()=>refresh());DialStore.initPanelOpen(id,true);return unsubscribe;},[id]);
  useEffect(()=>{
    const task=requestAnimationFrame(()=>{
      if(selected)setExpanded(old=>({...old,...Object.fromEntries([selected.section,...selected.related].flatMap(section=>[[`layer.${section.split('.')[0]}`,true],[`layer.${section}`,true]]))}));
      panelHost.current?.querySelector('.dialkit-panel-inner')?.scrollTo({top:0});
    });
    return()=>cancelAnimationFrame(task);
  },[selected,panelOpen,mode]);
  const panel=DialStore.getPanel(id);if(!panel)return null;
  const tokenByPath=new Map(controls.map(control=>[controlPath(control).join("."),control]));
  const allowed=new Set(selected?[selected.section,...selected.related]:[]);
  function filter(items:ControlMeta[]):ControlMeta[]{return items.flatMap(item=>{
    if(mode==='all')return [item];
    if(!selected)return [];
    const token=tokenByPath.get(item.path);
    const section=token?`${token.group}.${token.section}`:'';
    if(token&&selected.fieldKeys?.[section]&&!selected.fieldKeys[section].includes(token.key))return [];
    if(token)return allowed.has(`${token.group}.${token.section}`)&&(!selected.keys||`${token.group}.${token.section}`!==selected.section||selected.keys.includes(token.key))?[item]:[];
    if(item.type==='folder'){const children=filter(item.children??[]);return children.length?[{...item,children}]:[];}
    return [];
  });}
  function render(items:ControlMeta[],depth=0):React.ReactNode {return items.map(item=>{
    const token=tokenByPath.get(item.path);
    if(token?.type==="fluid"&&token.key.includes("font-size")) {
      const fixed=values[token.key+":mode"]==="fixed";
      const details=(item.children??[]).filter(child=>child.path.endsWith(".Mode")||(fixed?child.path.endsWith(".Fixed px"):!child.path.endsWith(".Fixed px")));
      return <div key={item.path}>
        <Slider label="Size (px)" value={Number(displayedSize(values,token.key,width).toFixed(2))} min={1} max={400} step={1} onChange={size=>onSize(resizedValues(values,token.key,width,size))}/>
        <Folder title="Responsive details" defaultOpen={false}><ControlRenderer panelId={id} controls={details} values={panel!.values}/></Folder>
      </div>;
    }
    if(item.type==="folder")return <div key={item.path} data-style-settings={item.path} data-selected={selected?.section===item.path?"true":undefined} data-style-group={depth===0?'true':undefined} className={depth===0?styles.settingsGroup:styles.settingsSection}>
      <Folder title={item.label} open={expanded[`${mode}.${item.path}`]??item.defaultOpen??true} onOpenChange={next=>setExpanded(old=>({...old,[`${mode}.${item.path}`]:next}))}>{render(item.children??[],depth+1)}</Folder>
    </div>;
    return <ControlRenderer key={item.path} panelId={id} controls={[item]} values={panel!.values}/>;
  });}
  return <div data-template-studio-ui className="dialkit-root" data-theme="dark">
    <PagePicker enabled={mode==='layer'&&panelOpen} device={device} context={context} frame={frame} onPick={setSelection} onStop={()=>chooseMode('all')}/>
    <div ref={panelHost} className={`dialkit-panel ${styles.devicePanel}`} data-position="bottom-right" data-origin-x="right" data-origin-y="bottom" {...dragging}>
      <Folder title="Design tokens" isRoot open={panelOpen} onOpenChange={next=>DialStore.setPanelOpen(id,next)} toolbar={<>
        <PresetManager panelId={id} presets={DialStore.getPresets(id)} activePresetId={DialStore.getActivePresetId(id)}/>
        <button className="dialkit-button" aria-label="Copy parameters" onClick={()=>navigator.clipboard.writeText(JSON.stringify(DialStore.getValues(id),null,2))}>Copy</button>
        <button className={`dialkit-button ${styles.dragHandle}`} data-studio-drag-handle aria-label="Move style panel" title="Drag to move · arrow keys to nudge · double-click or Home to reset" onDoubleClick={resetPosition} onKeyDown={onHandleKeyDown}>⠿</button>
      </>}>
        <div className={styles.deviceToolbar} data-device={device} role="group" aria-label="Device preview">
          <div data-switch="device"><ButtonGroup buttons={[{label:"Desktop",onClick:()=>onDevice("desktop")},{label:"Mobile",onClick:()=>onDevice("mobile")}]} /></div>
          <div data-switch="mode" data-mode={mode}><ButtonGroup buttons={[{label:"All styles",onClick:()=>chooseMode('all')},{label:"Select layer",onClick:()=>chooseMode('layer')}]} /></div>
          {mode==='layer'?<p className={styles.layerLabel} aria-live="polite">{selected?.label??'Click an element on the page'}</p>:<p>{device==="mobile"?"Mobile":"Desktop"} · {width}px</p>}
        </div>
        {mode==='layer'&&!selected?<p className={styles.emptySelection}>Select text, an image or a component to edit its shared styles. Esc returns to All styles.</p>:null}
        {render(filter(visibleControls(panel.controls,controls,device)))}
      </Folder>
    </div>
  </div>;
}
