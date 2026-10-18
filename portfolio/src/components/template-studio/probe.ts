import { tokenProperty, type TokenKey } from "./schema";
const properties = ["color", "background-color", "border-top-color", "border-radius", "font-family", "font-size", "font-weight", "line-height", "gap", "padding", "margin", "width", "height", "filter", "letter-spacing", "border-bottom-width", "outline-width", "outline-offset", "opacity", "transition-duration", "min-height", "max-width"];
function isPageElement(element: Element): element is HTMLElement {
  return element.namespaceURI === "http://www.w3.org/1999/xhtml" && !element.closest("[data-template-studio-ui], .dialkit-root, nextjs-portal, script, style, link, meta") && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
}
export function capturePaint(doc:Document=document) {
  return Array.from(doc.querySelectorAll("body, body *")).filter(isPageElement).slice(0, 2000).map((element) => {
    const style = getComputedStyle(element);
    return { element, values: properties.map((property) => style.getPropertyValue(property)) };
  });
}
export function finishProbe(before: ReturnType<typeof capturePaint>, highlight: boolean) {
  clearHighlights(before[0]?.element.ownerDocument);
  const affected = before.filter(({ element, values }) => {
    if (!element.isConnected) return false;
    const style = getComputedStyle(element);
    return properties.some((property, index) => style.getPropertyValue(property) !== values[index]);
  });
  if (highlight) for (const { element } of affected) element.setAttribute("data-studio-affected", "true");
  return affected.length;
}
export function clearHighlights(doc:Document=document) {
  doc.querySelectorAll("[data-studio-affected]").forEach(element=>element.removeAttribute("data-studio-affected"));
  if(doc===document)document.querySelectorAll<HTMLIFrameElement>('iframe[title$="site preview"]').forEach(frame=>{if(frame.contentDocument)clearHighlights(frame.contentDocument);});
}
export function tokenProbeValue(key: TokenKey, current = ""): string {
  const different = (first: string, second: string) => current.trim() === first ? second : first;
  if (key.startsWith("--color-")) return different("#fe00ef", "#00b879");
  if (key === "--font-body" || key === "--font-display" || key === "--font-lead") return different("monospace", "serif");
  if (key.includes("font-weight")) return different("900", "200");
  if (key.includes("opacity")) return different("0.2", "0.8");
  if (key.startsWith("--motion-")) return different("1s", "0.5s");
  if (tokenProperty(key) === "letter-spacing") return different("0.2em", "-0.1em");
  if (key.includes("line-height")) return different("1.9", "1.3");
  if (key.endsWith("-scale")) return different("1.8", "0.8");
  if (key.includes("filter")) return different("invert(1)", "none");
  return different("73px", "91px");
}

export function inspectElements(selector:string,doc:Document=document) {
  clearHighlights(doc);const elements=Array.from(doc.querySelectorAll(selector)).filter(isPageElement);
  for(const element of elements)element.setAttribute("data-studio-affected","true");
  const visible=elements.find(element=>{const box=element.getBoundingClientRect();return box.top>=0&&box.top<(doc.defaultView?.innerHeight??innerHeight);});
  (visible??elements[0])?.scrollIntoView({block:"center",behavior:"smooth"});return elements.length;
}
