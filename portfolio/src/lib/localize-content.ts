import { localizePath, type Locale } from "@/lib/localization";
/** Localize navigation fields without rewriting media, copy, or external URLs. */
export function localizeContentLinks<T>(value: T, locale: Locale): T {
  if (Array.isArray(value)) return value.map((item) => localizeContentLinks(item, locale)) as T;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === "href" && typeof item === "string" ? localizePath(item, locale) : localizeContentLinks(item, locale)])) as T;
}
