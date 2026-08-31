import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { markdownHeaders, pageToMarkdown } from "@lib/agent-content";

export const GET: APIRoute = async () => {
  const colophon = (await getCollection("colophon"))[0];
  return new Response(pageToMarkdown(colophon, "/colophon/"), {
    headers: markdownHeaders(),
  });
};
