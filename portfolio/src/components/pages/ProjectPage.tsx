import { localizeContentLinks } from "@/lib/localize-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FallbackProjectPage } from "@/components/project-blocks/FallbackProjectPage";
import { ProjectPageRenderer } from "@/components/project-blocks/ProjectPageRenderer";
import { getCaseStudyBySlug } from "@/lib/content";
import { getProjectBySlug, getPublishedProjects } from "@/lib/content";
import { localizePath, type Locale } from "@/content/locales";
import { MediaGallery } from "@/components/media-gallery/MediaGallery";
import {galleryProject,getMediaCatalog} from "@/lib/media-catalog";
import { buildMetadata, siteConfig } from "@/content/site";

interface ProjectPageProps {
  locale?: Locale;
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return getPublishedProjects()
    .map((project) => ({ slug: project.slug }));
}

export async function generateProjectMetadata({
  slug,
  locale = "en",
}: {
  slug: string;
  locale?: Locale;
}): Promise<Metadata> {
  const project = getProjectBySlug(slug);

  if (!project || project.published === false) {
    return buildMetadata();
  }

  const caseStudy = getCaseStudyBySlug(slug, locale);

  return buildMetadata({
    title: caseStudy?.seoTitle ?? project.name,
    description:
      caseStudy?.seoDescription ??
      `${project.client}${project.category ? ` / ${project.category}` : ""}`,
    path: localizePath(`/projects/${slug}/`, locale),
  });
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateProjectMetadata({ slug, locale: "en" });
}

export async function ProjectPage({ locale = "en", params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project || project.published === false) {
    notFound();
  }

  const caseStudy = getCaseStudyBySlug(slug, locale);

  return (
    <>
      <Header locale={locale} />
      <main id="main-content" data-media-project={JSON.stringify(galleryProject(project,caseStudy,locale))}>
        {caseStudy ? (
          <ProjectPageRenderer entry={localizeContentLinks(caseStudy, locale)} />
        ) : (
          <FallbackProjectPage project={project} locale={locale} />
        )}
      </main>
      <MediaGallery templateName={siteConfig.name} locale={locale} siteId={siteConfig.baseUrl} slides={getMediaCatalog(locale)}/>
      <Footer locale={locale} />
    </>
  );
}
