import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProjectsPageView } from "@/components/ProjectsPageView";
import { projectsCopy, projectCategoryLabels } from "@/content/projects-locales";
import { getProjectGridTiles } from "@/content/project-grid-assets";
import { getPublishedProjects } from "@/lib/content";
import type { Locale } from "@/content/locales";




export function ProjectsPage({ locale = "en" }: { locale?: Locale }) {
  const copy = projectsCopy[locale];
  const projects = getPublishedProjects();
  const tiles = getProjectGridTiles(locale);
  const categories = projectCategoryLabels[locale];

  return (
    <>
      <Header locale={locale} />
      <main id="main-content">
        <ProjectsPageView
          projects={projects}
          tiles={tiles}
          locale={locale}
          copy={copy}
          categories={categories}
        />
      </main>
      <Footer locale={locale} />
    </>
  );
}
