import type { CollectionEntry } from "astro:content";
import { HOME_PROJECT_SLUGS } from "@consts";

export function selectHomeProjects(projects: CollectionEntry<"projects">[]) {
  return HOME_PROJECT_SLUGS.flatMap((slug) => {
    const project = projects.find((entry) => entry.slug === slug && !entry.data.draft);
    return project ? [project] : [];
  });
}
