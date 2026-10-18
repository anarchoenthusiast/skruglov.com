import type { Metadata } from "next";
import { siteDefinition } from "@/content/site-data";
import { getLocaleFromPath, localizePath, stripLocale, locales } from "@/lib/localization";
export const siteConfig = siteDefinition;

/** Set BLOCK_SEARCH_INDEXING=true on Vercel until the site is ready for public launch. */
export const isSearchIndexingBlocked =
  !siteConfig.features.searchIndexing || process.env.BLOCK_SEARCH_INDEXING === "true";

export function buildMetadata({
  title,
  description,
  path = "/",
}: {
  title?: string;
  description?: string;
  path?: string;
} = {}): Metadata {
  const resolvedTitle = title
    ? `${title} — ${siteConfig.titleSuffix}`
    : siteConfig.defaultTitle;
  const resolvedDescription = description ?? siteConfig.defaultDescription;
  const normalizedPath = stripLocale(path);
  const locale = getLocaleFromPath(path);
  const canonicalUrl = new URL(localizePath(normalizedPath, locale), siteConfig.baseUrl).href;

  return {
    metadataBase: new URL(siteConfig.baseUrl),
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries([
        ...locales.map((lang) => [lang, new URL(localizePath(normalizedPath, lang), siteConfig.baseUrl).href]),
        ["x-default", new URL(normalizedPath, siteConfig.baseUrl).href],
      ]),
    },
    icons: {
      icon: [...siteConfig.seo.icons.icon],
      apple: siteConfig.seo.icons.apple,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      siteName: siteConfig.siteName,
      images: [siteConfig.seo.openGraphImage],
      locale: locale === "de" ? "de_DE" : siteConfig.seo.locale,
      alternateLocale: [locale === "de" ? siteConfig.seo.locale : "de_DE"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [siteConfig.seo.openGraphImage.url],
    },
    ...(isSearchIndexingBlocked
      ? {
          robots: {
            index: false,
            follow: false,
            nocache: true,
            googleBot: {
              index: false,
              follow: false,
              noimageindex: true,
            },
          },
        }
      : {}),
  };
}
