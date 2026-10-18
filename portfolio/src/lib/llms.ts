import { siteConfig } from "@/content/site";
import { getPublishedProjects } from "@/lib/content";
import { getCaseStudyBySlug } from "@/lib/content";
import { officePageContent } from "@/content/office";
function extractCopy(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(extractCopy);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).filter(([key]) => ["title", "text", "label", "heading", "lines", "segments", "paragraphs", "columns", "caption"].includes(key)).flatMap(([, item]) => extractCopy(item));
}
export function buildLlmsText(full = false) {
  const lines = [`# ${siteConfig.name}`, "", `> ${siteConfig.defaultDescription}`, "", "## Pages", ""];
  for (const [label,path] of [["Home","/"],["Projects","/projects/"],["Studio","/office/"],["Contact","/contact/"]]) lines.push(`- [${label}](${siteConfig.baseUrl}${path})`);
  lines.push("", "## Projects", "");
  for (const project of getPublishedProjects()) {
    const study = getCaseStudyBySlug(project.slug);
    lines.push(`- [${project.name}](${siteConfig.baseUrl}/projects/${project.slug}/): ${study?.seoDescription ?? project.category ?? project.client}`);
  }
  if (full) for (const project of getPublishedProjects()) {
    const study = getCaseStudyBySlug(project.slug);
    if (study) lines.push("", `## ${project.name}`, "", ...extractCopy(study.blocks));
  }
  if (full) lines.push("", "## Studio", "", officePageContent.intro, "", officePageContent.about, "", officePageContent.approach);
  return lines.join("\n") + "\n";
}
