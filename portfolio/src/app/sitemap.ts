import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/content";
import { isSearchIndexingBlocked, siteConfig } from "@/content/site";

const staticPaths = [
  "/",
  "/projects/",
  "/office/",
  "/contact/",
  "/impressum/",
  "/datenschutz/",
  "/de/",
  "/de/projects/",
  "/de/office/",
  "/de/contact/",
  "/de/impressum/",
  "/de/datenschutz/",
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (isSearchIndexingBlocked) {
    return [];
  }

  const projectPaths = getPublishedProjects().flatMap((project) => [
    `/projects/${project.slug}/`,
    `/de/projects/${project.slug}/`,
  ]);

  const paths = [...staticPaths, ...projectPaths];

  return paths.map((path) => ({
    url: `${siteConfig.baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "/" || path === "/de/" ? 1 : 0.7,
  }));
}
