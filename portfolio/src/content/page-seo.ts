import {homeSeo} from "@/content/seo";
import { buildMetadata, siteConfig } from "@/content/site";
import { localizePath, type Locale } from "@/content/locales";
import { officePageContent } from "@/content/office";
import { officePageCopy } from "@/content/office-locales";
import { projectsPageContent } from "@/content/projects";
import { projectsCopy } from "@/content/projects-locales";
import { contactPageContent } from "@/content/contact";
import { legalPageContent } from "@/content/legal";
export type PageKey = "home" | "office" | "projects" | "contact" | "imprint" | "privacy";
const paths: Record<PageKey, string> = { home: "/", office: "/office/", projects: "/projects/", contact: "/contact/", imprint: "/impressum/", privacy: "/datenschutz/" };
export function getPageMetadata(page: PageKey, locale: Locale = "en") {
  const content = {
    home: homeSeo[locale],
    office: { title: officePageContent.title, description: locale === "en" ? officePageContent.description : officePageCopy.de.about },
    projects: { title: projectsCopy[locale].title, description: projectsPageContent.description },
    contact: { title: locale === "de" ? "Kontakt" : "Contact", description: contactPageContent[locale].body },
    imprint: { title: legalPageContent[locale].imprint, description: siteConfig.defaultDescription },
    privacy: { title: legalPageContent[locale].privacy, description: siteConfig.defaultDescription },
  }[page];
  return buildMetadata({ ...content, path: localizePath(paths[page], locale) });
}
