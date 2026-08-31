import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { markdownHeaders } from "@lib/agent-content";
import { PROJECTS } from "@consts";

export const GET: APIRoute = async () => {
  const projects = (await getCollection("projects"))
    .filter((project) => !project.data.draft)
    .sort((a, b) => (a.data.priority ?? 99) - (b.data.priority ?? 99));

  const body = [
    `# ${PROJECTS.TITLE}`,
    "",
    PROJECTS.DESCRIPTION,
    "",
    "Canonical page: https://skruglov.com/projects/",
    "",
    ...projects.flatMap((project) => [
      `## ${project.data.title}`,
      "",
      project.data.description,
      "",
      `- Type: ${project.data.projectType}`,
      `- Duration: ${project.data.duration}`,
      `- Page: https://skruglov.com/projects/${project.slug}/`,
      `- Markdown: https://skruglov.com/projects/${project.slug}.md`,
      "",
    ]),
  ].join("\n");

  return new Response(body, { headers: markdownHeaders() });
};
