import {localizePath,type Locale} from "@/lib/localization";
import {navigation} from "@/content/locale-data";
export {copy,splashPhrases} from "@/content/locale-data";
export {locales,isLocale,localizePath,stripLocale,getLocaleFromPath,type Locale} from "@/lib/localization";
export function getNavigation(locale: Locale) {
  return navigation[locale].map((item) => ({
    ...item,
    href: localizePath(item.href, locale),
  }));
}
