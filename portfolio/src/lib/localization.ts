export type Locale = "en" | "de";
export const locales: Locale[] = ["en", "de"];
export function isLocale(value: string): value is Locale { return locales.includes(value as Locale); }
export function getLocaleFromPath(path: string): Locale { return /^\/de(?:\/|$)/.test(path) ? "de" : "en"; }
export function stripLocale(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.replace(/^\/de(?=\/|$)/, "") || "/";
}
export function localizePath(path: string, locale: Locale): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
  const normalized = stripLocale(path);
  return locale === "de" ? `/de${normalized}` : normalized;
}
