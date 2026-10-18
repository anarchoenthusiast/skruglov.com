"use client";
import {useEffect,useId,useRef,useState,type MouseEvent,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import {ProjectFigmaSlide} from '@/components/project-blocks/ProjectFigmaSlide';
import {mediaViewerCopy} from '@/content/media-viewer';
import {mediaFileName,mediaIdentity,MEDIA_VIEWER_EVENT,type GalleryMedia,type GalleryProject,type GallerySlide} from '@/lib/media-gallery';
import {mediaViewerSurfaces} from '@/theme/presets';
import type {Locale} from '@/lib/localization';
import {GalleryIcon} from './GalleryIcon';
import styles from './media-dialog.module.css';
type Props={templateName:string;slides:GallerySlide[];index:number;trigger:HTMLElement;locale:Locale;siteId:string;onClose:()=>void;onNavigate:(index:number)=>void};
export default function MediaDialog({templateName,slides,index,trigger,locale,siteId,onClose,onNavigate}:Props){
  const dialog=useRef<HTMLDialogElement>(null),callbacks=useRef({onClose,onNavigate,index});
  const start=useRef(false),id=useId(),slide=slides[index],{media:item,project}=slide,copy=mediaViewerCopy[locale];
  const [playing,setPlaying]=useState(false),[collapsed,setCollapsed]=useState(true),[surface,setSurface]=useState<'white'|'black'|null>(null);
  const storage=`template-media-likes:${siteId}`;
  const [likes,setLikes]=useState<string[]>(()=>{try{const value=JSON.parse(localStorage.getItem(storage)??'[]');return Array.isArray(value)?value.filter((value):value is string=>typeof value==='string'):[];}catch{return [];}});
  const identity=mediaIdentity(item),liked=likes.includes(identity),title=item.alt||mediaFileName(item.src??'')||copy.composition;
  function like(){
    let values=likes;try{const stored=JSON.parse(localStorage.getItem(storage)??'[]');if(Array.isArray(stored))values=stored.filter((value):value is string=>typeof value==='string');}catch{}
    const next=new Set(values);if(liked)next.delete(identity);else next.add(identity);setLikes([...next]);try{localStorage.setItem(storage,JSON.stringify([...next]));}catch{/* Keep the current gallery usable without browser storage. */}
  }
  const likeButton=<button type="button" data-media-like aria-label={liked?copy.liked:copy.like} aria-pressed={liked} onClick={like}><GalleryIcon name={liked?'liked':'heart'}/><span>{liked?1:0}</span></button>;
  useEffect(()=>{callbacks.current={onClose,onNavigate,index};},[onClose,onNavigate,index]);
  function navigate(next:number){setPlaying(false);onNavigate((next+slides.length)%slides.length);}
  useEffect(()=>{
    if(!playing||slides.length<2)return;
    let timer:ReturnType<typeof setTimeout>;
    function schedule(){clearTimeout(timer);if(!document.hidden)timer=setTimeout(()=>callbacks.current.onNavigate((callbacks.current.index+1)%slides.length),5000);}
    schedule();document.addEventListener('visibilitychange',schedule);
    return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',schedule);};
  },[playing,index,slides]);
  function toggleSurface(){
    // The initial paper follows the theme; the first click switches to its opposite.
    const channels=getComputedStyle(dialog.current!).backgroundColor.match(/[\d.]+/g)?.slice(0,3).map(Number)??[255,255,255];
    const dark=channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722<128;
    setSurface(dark?'white':'black');
  }
  const paper=surface?mediaViewerSurfaces[surface]:undefined;
  const surfaceStyle=paper?{'--viewer-bg':paper.background,'--viewer-ink':paper.text,'--color-focus':paper.text,'--viewer-button-bg':paper.text,'--viewer-button-text':paper.background,'--viewer-button-hover-bg':`color-mix(in srgb,${paper.text} 85%,${paper.background})`,'--viewer-button-hover-text':paper.background} as CSSProperties:undefined;
  useEffect(()=>{
    const element=dialog.current!;const overflow=document.body.style.overflow;
    element.showModal();document.body.style.overflow='hidden';document.documentElement.dataset.mediaViewerOpen='true';window.dispatchEvent(new Event(MEDIA_VIEWER_EVENT));
    element.querySelector<HTMLButtonElement>('[data-close]')?.focus({preventScroll:true});
    function key(event:KeyboardEvent){
      if(event.defaultPrevented||event.target instanceof HTMLVideoElement)return;
      if(event.key==='Tab'){
        const controls=Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],video[controls],input,textarea,select,[tabindex="0"]')).filter(control=>control.getClientRects().length>0);
        const first=controls[0],last=controls.at(-1);
        if(!first){event.preventDefault();return;}
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        return;
      }
      if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||(event.target instanceof Element&&event.target.closest('input,textarea,select,video,[contenteditable=true]')))return;
      const delta=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0,next=callbacks.current.index+delta;
      if(delta&&slides.length>1){event.preventDefault();setPlaying(false);callbacks.current.onNavigate((next+slides.length)%slides.length);}
    }
    element.addEventListener('keydown',key);
    return()=>{element.removeEventListener('keydown',key);element.close();document.body.style.overflow=overflow;delete document.documentElement.dataset.mediaViewerOpen;window.dispatchEvent(new Event(MEDIA_VIEWER_EVENT));if(trigger.isConnected)trigger.focus({preventScroll:true});};
  },[slides,trigger]);
  function outside(event:MouseEvent<HTMLDialogElement>){const rect=event.currentTarget.getBoundingClientRect();return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;}
  return createPortal(<dialog ref={dialog} data-media-dialog data-project={project.href} data-gallery-index={index} data-gallery-total={slides.length} data-collapsed={collapsed} data-surface={surface??'theme'} style={surfaceStyle} className={styles.dialog} aria-label={title} lang={locale} onCancel={event=>{event.preventDefault();onClose();}} onPointerDown={event=>{start.current=outside(event);}} onClick={event=>{if(start.current&&event.target===event.currentTarget&&outside(event))onClose();start.current=false;}}>
    <header className={styles.tools}>
      <span data-media-brand className={styles.brand}>{templateName}</span>
      <button type="button" data-close aria-label={copy.close} onClick={onClose}><GalleryIcon name="close"/></button>
    </header>
    <nav className={styles.navigation} aria-label={copy.gallery}>
      <div className={styles.start}>
        <button type="button" data-media-background aria-label={copy.background} title={copy.background} onClick={toggleSurface}><GalleryIcon name="contrast"/></button>
      </div>
      <div className={styles.playback}>
        <button type="button" data-media-play aria-label={playing?copy.pause:copy.play} title={playing?copy.pause:copy.play} aria-pressed={playing} disabled={slides.length<2} onClick={()=>setPlaying(value=>!value)}><GalleryIcon name={playing?'pause':'play'}/></button>
        <span data-media-counter aria-live="polite">{slide.position+1} / {slide.count}</span>
        <button type="button" aria-label={copy.previous} disabled={slides.length<2} onClick={()=>navigate(index-1)}><GalleryIcon name="previous"/></button>
        <button type="button" aria-label={copy.next} disabled={slides.length<2} onClick={()=>navigate(index+1)}><GalleryIcon name="next"/></button>
      </div>
      <div className={styles.end}>{!collapsed?<Link data-media-project-link className={styles.projectButton} href={project.href} onClick={onClose}>{copy.project} ↗</Link>:null}<div className={styles.actionIcons}><button type="button" data-media-details aria-label={collapsed?copy.showDetails:copy.hideDetails} title={collapsed?copy.showDetails:copy.hideDetails} aria-expanded={!collapsed} aria-controls={id} onClick={()=>setCollapsed(value=>!value)}><GalleryIcon name="info"/></button>{likeButton}</div></div>
    </nav>
    <MediaContent key={identity} project={project} playing={playing} collapsed={collapsed} item={item} panelId={id} locale={locale}/>
  </dialog>,document.body);
}
function MediaContent({item,project,playing,collapsed,panelId,locale}:{item:GalleryMedia;project:GalleryProject;playing:boolean;collapsed:boolean;panelId:string;locale:Locale}){
  const copy=mediaViewerCopy[locale],title=item.alt||mediaFileName(item.src??'')||copy.composition;
  const [error,setError]=useState(false),[retry,setRetry]=useState(0);
  const video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLDivElement>(null),[box,setBox]=useState({width:800,height:600});
  useEffect(()=>{
    const element=video.current;if(!element)return;
    if(playing){element.muted=true;void element.play().catch(()=>{});}else element.pause();
    return()=>element.pause();
  },[playing,retry,error]);
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>setBox({width:entry.contentRect.width,height:entry.contentRect.height}));if(canvas.current)observer.observe(canvas.current);return()=>observer.disconnect();},[]);
  const composition=item.composition,w=composition?.slideWidth??960,h=composition?.slideHeight??640;
  const rows=[{label:copy.projectName,value:project.name},...(project.year?[{label:copy.year,value:String(project.year)}]:[]),...(project.role?[{label:copy.role,value:project.role}]:[]),...(project.skills.length?[{label:copy.skills,value:project.skills.join(', ')}]:[])];
  return <>
    <section className={styles.stage} aria-label={title}>
      <div ref={canvas} className={styles.canvas}>
        {error?<div className={styles.failure} role="status"><p>{copy.unavailable}</p><button type="button" onClick={()=>{setError(false);setRetry(value=>value+1);}}>{copy.retry}</button></div>:item.type==='composition'&&composition?<div className={styles.composition} style={{width:Math.min(box.width,box.height*w/h),aspectRatio:`${w}/${h}`}}><ProjectFigmaSlide {...composition} radius={0}/></div>:item.type==='video'?<video ref={video} key={retry} src={item.src} poster={item.poster} aria-label={item.alt} controls playsInline preload="metadata" onError={()=>setError(true)}/>:
          // Original media loads only while this viewer is open.
          // eslint-disable-next-line @next/next/no-img-element
          <img key={retry} src={item.src} alt={item.alt} draggable={false} onError={()=>setError(true)}/>
        }
      </div>
    </section>
    <aside id={panelId} className={styles.inspector} hidden={collapsed} aria-label={copy.showDetails}>
      <div className={styles.details}><h2>{title}</h2><dl className={styles.metadata}>{rows.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div>
    </aside>
  </>;
}
