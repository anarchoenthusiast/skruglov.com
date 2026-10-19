import type { ThemeTokens } from "@/theme/presets";
export type TokenKey = keyof ThemeTokens;
export type ControlMeaning = { group: string; section: string; label: string };
const meanings: Partial<Record<TokenKey, ControlMeaning>> = {};
function define(group: string, section: string, entries: Partial<Record<TokenKey, string>>) {
  for (const [key,label] of Object.entries(entries)) meanings[key as TokenKey] = {group,section,label};
}
define("Typography","Titles", {"--font-display":"Font","--font-size-title":"Size · desktop","--font-size-title-mobile":"Size · mobile","--line-height-title":"Line height","--letter-spacing-title":"Letter spacing"});
define("Typography","Lead paragraphs", {"--font-lead":"Font","--font-size-intro":"Size · desktop","--font-size-intro-mobile":"Size · mobile","--line-height-intro":"Line height"});
define("Typography","Body & interface", {"--font-body":"Font","--font-size-body":"Size · desktop","--font-size-body-mobile":"Size · mobile","--line-height-body":"Line height"});
define("Typography","Notes & credits", {"--font-size-small":"Size"});
define("Typography","Navigation", {"--font-size-navigation-mobile":"Mobile size"});
define("Typography","Details", {"--font-weight-regular":"Normal weight","--font-weight-strong":"Emphasis weight","--line-height-relaxed":"List row line height"});
define("Layout","Page", {"--page-gutter-desktop":"Side margins · desktop","--page-gutter-mobile":"Side margins · mobile","--section-space-desktop":"Section gap · desktop","--section-space-mobile":"Section gap · mobile","--grid-gap":"Column gap · desktop","--grid-gap-mobile":"Column gap · mobile"});
define("Layout","Case studies", {"--project-block-space-scale":"Block spacing scale","--project-hero-space":"Title top gap"});
define("Layout","Header", {"--header-height":"Height · desktop","--header-height-mobile":"Height · mobile","--nav-gap":"Link gap · desktop (ch)","--nav-gap-mobile":"Link gap · mobile (ch)","--nav-meta-gap":"Language gap (ch)"});
define("Layout","Footer", {"--footer-padding-top":"Top padding · desktop","--footer-padding-bottom":"Bottom padding · desktop","--footer-padding-top-mobile":"Top padding · mobile","--footer-padding-bottom-mobile":"Bottom padding · mobile","--space-10":"Row gap · desktop","--footer-about-max":"About text max width"});
define("Layout","Page details", {"--page-title-space":"Page title gap · desktop","--page-content-space":"After-title gap · desktop","--legal-page-space":"Legal top gap","--legal-content-max":"Legal max width","--empty-content-max":"Empty state max width","--fallback-content-max":"Fallback max width"});
define("Components","Form", {"--form-max":"Form max width","--control-height":"Min control height (em)","--textarea-height":"Min message height (em)","--field-inset-x":"Field side padding (em)","--field-inset-y":"Message vertical padding (em)","--button-inset-x":"Button side padding (em)","--status-min-height":"Status height (em)","--control-radius":"Control corners","--opacity-disabled":"Disabled button opacity"});
define("Components","Media", {"--media-radius":"Frame corners","--brand-image-filter":"Logo on page","--brand-footer-filter":"Logo in footer"});
define("Components","Project tabs", {"--tab-gap":"Tab gap (em)","--opacity-inactive":"Inactive tab opacity"});
define("Components","Focus & motion", {"--border-width":"Link and field borders","--focus-width":"Focus outline width","--focus-offset":"Focus outline gap","--motion-header":"Header slide duration (s)","--motion-hover":"Nav underline duration (s)"});
define("Components","Splash", {"--splash-content-max":"Text max width"});
define("Advanced","Shared spacing", {"--space-2":"Mobile media gap · small","--space-3":"Tight gap","--space-4":"Small gap","--space-5":"Medium gap","--space-6":"Mobile media gap · medium","--space-7":"Section item gap","--space-8":"Large gap","--paragraph-space-body":"Body paragraph gap (em)","--paragraph-space-intro":"Lead paragraph gap (em)"});
define("Colors","Page", {"--color-body-bg":"Background","--color-body-text":"Text","--color-muted":"Secondary text"});
define("Colors","Footer", {"--color-footer-bg":"Background","--color-footer-text":"Text"});
define("Colors","Fields & focus", {"--color-field-border":"Field border","--color-placeholder":"Placeholder text","--color-focus":"Keyboard focus"});
define("Colors","Buttons", {"--color-button-bg":"Background","--color-button-text":"Label","--color-button-hover-bg":"Hover background","--color-button-hover-text":"Hover label"});
define("Colors","Media defaults", {"--color-media-bg":"Preview background","--color-substrate":"Image backdrop"});
define("Colors","Splash", {"--color-splash-bg":"Background","--color-splash-text":"Text"});
export function meaningFor(key: TokenKey): ControlMeaning {
  const meaning=meanings[key];if(!meaning) throw new Error(`Missing component meaning for ${key}`);return meaning;
}
export const inspectedSections: Record<string, {selector: string; description: string}> = {
  "Colors.Page":{selector:'body',description:"Shared page background and text colors."},
  "Colors.Footer":{selector:'.site-footer',description:"Footer background and text colors."},
  "Colors.Fields & focus":{selector:'.contact-form__field',description:"Field border, placeholder and keyboard focus colors."},
  "Colors.Buttons":{selector:'.contact-form__button',description:"Button background, label and hover colors."},
  "Colors.Splash":{selector:'.site-splash',description:"Splash background and text colors."},
  "Layout.Page details":{selector:'.legal-shell,.page-title',description:"Page title spacing and content widths."},
  "Components.Splash":{selector:'.site-splash',description:"Splash text width."},
  "Typography.Titles":{selector:'h1:not(.visually-hidden), [data-type-role="display"], .page-title__button',description:"Page and case titles. Body font does not change these."},
  "Typography.Lead paragraphs":{selector:'.text-holder-large, [data-type-role="lead"]',description:"Large introductory paragraphs, using their own lead typeface."},
  "Typography.Body & interface":{selector:'.text-holder, [data-type-role="body"], .site-header, .site-footer__about-body, .site-footer__about-title, .site-footer__contacts, .legal-shell p, .contact-form__field, .contact-form__button',description:"Reading text, navigation, footer and form labels. Notes inherit this family."},
  "Typography.Notes & credits":{selector:'.text-holder-small, [data-type-role="caption"], .site-footer__disclaimer, .contact-form__status',description:"One caption size across desktop and mobile: notes, credits and supporting form text."},
  "Typography.Navigation":{selector:'.site-header',description:"All header links, including the language switch, share the same mobile size."},
  "Layout.Page":{selector:'.page-shell,.page-title,.project-wrap,.media-grid-outer,.site-footer__inner',description:"Page gutters, section rhythm and grid columns."},
  "Layout.Case studies":{selector:'.project-wrap',description:"Case block margins, including content-specific spacing ratios."},
  "Layout.Header":{selector:'.site-header',description:"Header frame and spacing between navigation links."},
  "Layout.Footer":{selector:'.site-footer__inner,.site-footer__row,.site-footer__column--about',description:"Footer padding, row spacing and text width."},
  "Components.Form":{selector:'.contact-form',description:"Contact form controls. Visible on the contact page when the form is enabled."},
  "Components.Media":{selector:'.media-cover,.template-media-frame,.project-card__link,.project-index__preview-frame,.project-slide-wrap,.brand-logo',description:"Template frames and monochrome brand marks; artwork pixels keep their own paint."},
  "Components.Project tabs":{selector:'.projects-view-tabs,.page-title__button',description:"Index/image view tabs on the projects page."},
};
export type EditorTree = { [key: string]: string | number | EditorTree };
export function readPath(tree: unknown,path: string[]): unknown { let value=tree;for(const key of path)value=(value as Record<string,unknown> | undefined)?.[key];return value; }
export function writePath(tree: EditorTree,path: string[],value: string | number) { let node=tree;for(const key of path.slice(0,-1)){if(typeof node[key]!=="object")node[key]={};node=node[key] as EditorTree;}node[path.at(-1)!]=value; }
