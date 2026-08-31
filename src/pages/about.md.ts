import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { markdownHeaders, pageToMarkdown } from "@lib/agent-content";

export const GET: APIRoute = async () => {
  const about = (await getCollection("about"))[0];
  return new Response(pageToMarkdown(about, "/about/"), {
    headers: markdownHeaders(),
  });
};
