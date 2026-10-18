import type { FigmaSlideBlock, MediaAsset, ProjectPageBlock } from "@/content/types";
export type GalleryProject = {name:string;year?:number;role?:string;skills:string[];href:string};
export type GalleryMedia = {
  type: "image" | "video" | "composition";
  src?: string; poster?: string; alt: string; width?: number; height?: number;
  composition?: Omit<FigmaSlideBlock,"kind"|"marginTop">;
};
export type GallerySlide = {media:GalleryMedia;project:GalleryProject;position:number;count:number};
export function mediaIdentity(item:GalleryMedia) {
  return item.type==='composition'?`composition:${JSON.stringify(item.composition)}`:`${item.type}:${item.src}`;
}
export function mediaFileName(src:string) {
  try{return decodeURIComponent(new URL(src,'https://template.invalid').pathname.split('/').pop()??'');}catch{return src.split('/').pop()??src;}
}
export function mediaFormat(item:GalleryMedia) {return item.type==='composition'?'Composition':mediaFileName(item.src??'').split('.').at(-1)?.toUpperCase()??item.type;}
export function assetMedia(asset:MediaAsset):GalleryMedia {return {...asset,type:asset.type??'image'};}
/** Explicit authored descriptors keep original files and composed slides out of DOM/image-optimizer guessing. */
export function mediaAttributes(item:GalleryMedia) {
  return {'data-media-item':JSON.stringify(item),'aria-haspopup':'dialog' as const,role:'button',tabIndex:0,'aria-label':item.alt||mediaFileName(item.src??'')};
}
export function readGallery(items:Element[]) {
  const result:{item:GalleryMedia;trigger:HTMLElement}[]=[];
  for(const element of items){
    if(!(element instanceof HTMLElement)||!element.getClientRects().length)continue;
    try{const item=JSON.parse(element.getAttribute('data-media-item')??'null') as GalleryMedia;
      if(!item||!['image','video','composition'].includes(item.type)||typeof item.alt!=='string'||(item.type==='composition'?!Array.isArray(item.composition?.media):typeof item.src!=='string'))continue;
      result.push({item,trigger:element});
    }catch{ /* A malformed authoring attribute must not break ordinary links. */ }
  }
  return result;
}

export const MEDIA_VIEWER_EVENT='template-media-viewer';

/** Shared authoring contract: both page annotations and the cross-project catalog use these descriptors. */
export function blockGalleryMedia(block:ProjectPageBlock):GalleryMedia[] {
  switch(block.kind){
    case 'fullWidthImage':return [assetMedia(block.image)];
    case 'twoColMedia':case 'threeColMedia':return block.items.map(item=>assetMedia(item.image));
    case 'figmaSlide':return [{type:'composition',alt:block.media.map(item=>item.alt).filter(Boolean).join(' · '),composition:{background:block.background,slideWidth:block.slideWidth,slideHeight:block.slideHeight,media:block.media}}];
    case 'slideVideo':return [{type:'video',src:block.src,poster:block.poster,alt:block.alt}];
    default:return [];
  }
}
