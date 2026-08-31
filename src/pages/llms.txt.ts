import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildLlmsIndex, markdownHeaders } from "@lib/agent-content";

export const GET: APIRoute = async () => {
  const projects = (await getCollection("projects"))
    .filter((project) => !project.data.draft)
    .sort((a, b) => (a.data.priority ?? 99) - (b.data.priority ?? 99));
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return new Response(buildLlmsIndex({ projects, posts }), {
    headers: markdownHeaders(),
  });
};
