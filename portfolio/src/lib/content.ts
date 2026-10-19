import {homePageContent} from "@/content/home";
import {projectsPageContent} from "@/content/projects";
import {caseStudies} from "@/content/case-studies";
import {caseStudiesDe} from "@/content/case-studies/de";
import {localizePath,type Locale} from "@/lib/localization";
export function getHomePageSections(locale: Locale = "en") {
  return homePageContent.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href: item.href ? localizePath(item.href, locale) : undefined,
    })),
  }));
}

export function getProjectBySlug(slug: string) {
  return projectsPageContent.projects.find((project) => project.slug === slug);
}

export function getPublishedProjects() {
  return projectsPageContent.projects.filter((project) => project.published ?? true);
}

export function getCaseStudyBySlug(slug: string, locale: Locale = "en") {
  if (locale === "de") {
    return caseStudiesDe[slug] ?? caseStudies[slug];
  }

  return caseStudies[slug];
}

