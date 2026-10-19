"use client";
import dynamic from 'next/dynamic';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import type {Locale} from '@/lib/localization';
import {readGallery,mediaIdentity,type GallerySlide} from '@/lib/media-gallery';
const MediaDialog=dynamic(()=>import('./MediaDialog'),{ssr:false});
type Selection={index:number;trigger:HTMLElement;path:string};
export function MediaGallery({templateName,locale,siteId,slides}:{templateName:string;locale:Locale;siteId:string;slides:GallerySlide[]}) {
  const path=usePathname(),[selection,setSelection]=useState<Selection|null>(null);
  useEffect(()=>{
    function open(target:Element){
      const trigger=target.closest<HTMLElement>('[data-media-item]');const scope=trigger?.closest('main[data-media-project]');if(!trigger||!scope)return false;
      const entries=readGallery(Array.from(scope.querySelectorAll('[data-media-item]'))),at=entries.findIndex(entry=>entry.trigger===trigger);
      if(at<0)return false;
      let href:string;try{href=JSON.parse(scope.getAttribute('data-media-project')??'null').href;}catch{return false;}
      const index=slides.findIndex(slide=>slide.project.href===href&&slide.position===at&&mediaIdentity(slide.media)===mediaIdentity(entries[at].item));
      if(index<0)return false;
      setSelection({index,trigger,path});return true;
    }
    function click(event:MouseEvent){
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||!(event.target instanceof Element))return;
      // Preserve in-page video transport controls; the focusable frame opens with Enter.
      if(event.target instanceof HTMLVideoElement&&event.target.controls)return;
      if(open(event.target)){event.preventDefault();event.stopPropagation();}
    }
    function key(event:KeyboardEvent){
      if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||!['Enter',' '].includes(event.key)||!(event.target instanceof HTMLElement)||!event.target.matches('[data-media-item]'))return;
      if(open(event.target)){event.preventDefault();event.stopPropagation();}
    }
    document.addEventListener('click',click,true);document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('click',click,true);document.removeEventListener('keydown',key);setSelection(null);};
  },[path,slides]);
  if(!selection||selection.path!==path)return null;
  return <MediaDialog templateName={templateName} slides={slides} index={selection.index} trigger={selection.trigger} locale={locale} siteId={siteId} onClose={()=>setSelection(null)} onNavigate={index=>setSelection(old=>old?{...old,index:(index+slides.length)%slides.length}:null)}/>;
}
