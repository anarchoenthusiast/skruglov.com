import type { CaseStudyEntry, HomeSection, ProjectSummary } from "@/content/types";
export interface ContentInput { projects: ProjectSummary[]; studies: Record<string, CaseStudyEntry>; translations?: Record<string, CaseStudyEntry>; home: HomeSection[]; site: object; }
export function validateContent(input: ContentInput, assetExists: (path: string) => boolean): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();
  for (const project of input.projects) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) errors.push(`Invalid slug: ${project.slug}`);
    if (slugs.has(project.slug)) errors.push(`Duplicate project: ${project.slug}`);
    slugs.add(project.slug);
    if (project.href && project.href !== `/projects/${project.slug}/`) errors.push(`Project ${project.slug} must use /projects/${project.slug}/`);
    if (project.coverWidth <= 0 || project.coverHeight <= 0) errors.push(`Invalid cover dimensions: ${project.slug}`);
  }
  for (const [key, study] of Object.entries({ ...input.studies, ...input.translations })) {
    if (study.slug !== key || !slugs.has(study.slug)) errors.push(`Unregistered case study: ${key}`);
    if (!study.seoTitle || !study.seoDescription) errors.push(`Missing SEO: ${key}`);
    if (study.blocks.filter((b) => b.kind === "projectHero").length !== 1) errors.push(`Case study ${key} needs exactly one projectHero`);
    for (const block of study.blocks) {
      if (block.kind === "figmaSlide" && ((block.slideWidth ?? 960) <= 0 || (block.slideHeight ?? 640) <= 0 || block.media.some((m) => m.w <= 0 || m.h <= 0))) errors.push(`Invalid slide dimensions: ${key}`);
    }
  }
  const ready = new Set(["/", "/office/", "/contact/", "/projects/", "/impressum/", "/datenschutz/", ...input.projects.filter((p) => p.published !== false).map((p) => `/projects/${p.slug}/`)]);
  function walk(value: unknown, path: string) {
    if (Array.isArray(value)) { value.forEach((v, i) => walk(v, `${path}[${i}]`)); return; }
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      const location = `${path}.${key}`;
      if (typeof item === "string") {
        if (["src", "poster", "coverImage", "invertedSrc"].includes(key) || (key === "url" && item.startsWith("/"))) {
          if (!item.startsWith("/") || item.startsWith("//") || item.includes("..") || !assetExists(item)) errors.push(`Missing or nonlocal asset at ${location}: ${item}`);
        }
        if (key === "href") {
          if (/^(?:https?:|mailto:|tel:|#)/.test(item)) continue;
          if (!item.startsWith("/") || item.startsWith("//")) { errors.push(`Unsafe link at ${location}`); continue; }
          const stripped = item.replace(/^\/de(?=\/|$)/, "") || "/";
          const pathname = stripped.split(/[?#]/)[0];
          const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
          if (!ready.has(normalized)) errors.push(`Unavailable route at ${location}: ${item}`);
        }
      }
      if (["width", "height"].includes(key) && typeof item === "number" && item <= 0) errors.push(`Invalid dimension at ${location}`);
      walk(item, location);
    }
  }
  // Drafts stay editable but must not appear in public navigation or the homepage.
  walk(input.site, "site"); walk(input.home, "home");
  walk(input.projects.filter((p) => p.published !== false), "projects");
  for (const [key, study] of Object.entries(input.studies)) if (ready.has(`/projects/${key}/`)) walk(study, `caseStudies.${key}`);
  for (const [key, study] of Object.entries(input.translations ?? {})) if (ready.has(`/projects/${key}/`)) walk(study, `translations.${key}`);
  return [...new Set(errors)];
}
