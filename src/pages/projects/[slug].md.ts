import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { markdownHeaders, projectToMarkdown } from "@lib/agent-content";

export async function getStaticPaths() {
  const projects = (await getCollection("projects")).filter((project) => !project.data.draft);
  return projects.map((project) => ({
    params: { slug: project.slug },
    props: { project },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { project } = props as { project: CollectionEntry<"projects"> };
  return new Response(projectToMarkdown(project), {
    headers: markdownHeaders(),
  });
};
