import {getCaseStudyBySlug} from '@/lib/content';
import {getPublishedProjects} from '@/lib/content';
import {localizePath,type Locale} from '@/content/locales';
import type {CaseStudyEntry,ProjectSummary} from '@/content/types';
import {assetMedia,blockGalleryMedia,type GalleryProject,type GallerySlide} from './media-gallery';
export function galleryProject(project:ProjectSummary,study:CaseStudyEntry|undefined,locale:Locale):GalleryProject {
  return {name:project.name,year:project.year,role:study?.role,skills:study?.skills??project.tags??[],href:localizePath(`/projects/${project.slug}/`,locale)};
}
/** Server-side manifest only; originals are fetched when their slide is viewed. */
export function getMediaCatalog(locale:Locale):GallerySlide[] {
  return getPublishedProjects().flatMap(project=>{
    const study=getCaseStudyBySlug(project.slug,locale),context=galleryProject(project,study,locale);
    const media=study?study.blocks.flatMap(blockGalleryMedia):[assetMedia({src:project.coverImage,alt:project.name,width:project.coverWidth,height:project.coverHeight})];
    return media.map((item,position)=>({media:item,project:context,position,count:media.length}));
  });
}
