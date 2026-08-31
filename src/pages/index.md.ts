import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildHomeMarkdown, markdownHeaders } from "@lib/agent-content";
import { SITE } from "@consts";

export const GET: APIRoute = async () => {
  const projects = (await getCollection("projects"))
    .filter((project) => !project.data.draft)
    .sort((a, b) => (a.data.priority ?? 99) - (b.data.priority ?? 99))
    .slice(0, SITE.NUM_PROJECTS_ON_HOMEPAGE);
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, SITE.NUM_POSTS_ON_HOMEPAGE);

  return new Response(buildHomeMarkdown({ projects, posts }), {
    headers: markdownHeaders(),
  });
};
