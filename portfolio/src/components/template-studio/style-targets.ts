import { inspectedSections } from "./control-model";
import type { StudioDevice } from "./device-model";
export type StyleTarget={element:Element;section:string;related:string[];label:string;keys?:string[];fieldKeys?:Record<string,string[]>};
const ignored='[data-template-studio-ui],.dialkit-root,nextjs-portal,[hidden],input[type="file"],script,style,link,meta,.visually-hidden,.honeypot';
/** Use actual template roles before broader layout ancestors; artwork has no editable pixel styles. */
export function findStyleTarget(start:Element,device:StudioDevice):StyleTarget|null {
  if(start.closest(ignored)||!start.getClientRects().length)return null;
  const rules:[string,string,string[]?][]=[
    ['.projects-view-tabs,.page-title__button','Components.Project tabs',['Typography.Titles']],
    ['.brand-logo','Components.Media'],
    ['.media-cover,.template-media-frame,.project-card__link,.project-index__preview-frame,.project-slide-wrap,[style*="var(--media-radius)"]','Components.Media'],
    ['.contact-form__field','Components.Form',['Typography.Body & interface','Colors.Fields & focus']],
    ['.contact-form__button','Components.Form',['Typography.Body & interface','Colors.Buttons']],
    ['h1:not(.visually-hidden),[data-type-role="display"]','Typography.Titles'],
    ['[data-type-role="lead"],.text-holder-large','Typography.Lead paragraphs'],
    ['[data-type-role="caption"],.text-holder-small,.site-footer__disclaimer,.contact-form__status','Typography.Notes & credits',['Typography.Body & interface']],
    ['.site-header',device==='mobile'?'Typography.Navigation':'Typography.Body & interface',['Layout.Header',...(device==='mobile'?['Typography.Body & interface']:[])]],
    ['[data-type-role="body"],.text-holder,.site-footer p,.site-footer__contacts,.legal-shell p,.legal-shell h2,.project-index,.projects-shell__empty','Typography.Body & interface'],
    ['.contact-form','Components.Form'],
    ['.site-splash','Components.Splash',['Colors.Splash']],
    ['.site-footer','Layout.Footer',['Colors.Footer']],
    ['.project-wrap','Layout.Case studies',['Layout.Page']],
    ['.legal-shell','Layout.Page details',['Colors.Page']],
    ['.page-shell,.page-title,.media-grid-outer,main','Layout.Page',['Colors.Page']],
    ['body','Colors.Page'],
  ];
  for(const [selector,section,extra=[]]of rules){
    const element=start.closest(selector);if(!element)continue;
    const related=[...extra];
    if(start.closest('.site-footer'))related.push('Colors.Footer');
    else if(!section.startsWith('Colors.')&&!section.startsWith('Components.'))related.push('Colors.Page');

    const keys=section==='Components.Media'?(element.matches('.brand-logo')?[element.matches('.brand-logo--inverted')?'--brand-footer-filter':'--brand-image-filter']:['--media-radius']):undefined;
    const fieldKeys:Record<string,string[]>={};
    if(section.startsWith('Typography.')){fieldKeys['Colors.Page']=['--color-body-text'];fieldKeys['Colors.Footer']=['--color-footer-text'];}
    if(section==='Typography.Notes & credits')fieldKeys['Typography.Body & interface']=['--font-body','--line-height-body'];
    if(section==='Typography.Navigation')fieldKeys['Typography.Body & interface']=['--font-body','--line-height-body'];
    if(element.matches('.contact-form__field'))fieldKeys['Components.Form']=['--control-height','--textarea-height','--field-inset-x','--field-inset-y','--control-radius'];
    if(element.matches('.contact-form__button'))fieldKeys['Components.Form']=['--control-height','--button-inset-x','--control-radius','--opacity-disabled'];
    const label=section==='Components.Media'?(element.matches('.brand-logo')?'Brand mark':'Media frame'):element.matches('.contact-form__field')?'Form field':element.matches('.contact-form__button')?'Form button':element.matches('.site-header')?'Navigation':section.replace('.', ' → ');
    return {element,section,keys,fieldKeys,related:[...new Set(related)].filter(key=>key!==section&&Boolean(inspectedSections[key])).slice(0,3),label};
  }
  return null;
}
