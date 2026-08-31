import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import {
  buildHomeMarkdown,
  markdownHeaders,
  pageToMarkdown,
  postToMarkdown,
  projectToMarkdown,
} from "@lib/agent-content";

export const GET: APIRoute = async () => {
  const projects = (await getCollection("projects"))
    .filter((project) => !project.data.draft)
    .sort((a, b) => (a.data.priority ?? 99) - (b.data.priority ?? 99));
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const about = (await getCollection("about"))[0];
  const colophon = (await getCollection("colophon"))[0];

  const parts = [
    buildHomeMarkdown({ projects, posts }),
    about ? pageToMarkdown(about, "/about/") : "",
    ...projects.map(projectToMarkdown),
    ...posts.map(postToMarkdown),
    colophon ? pageToMarkdown(colophon, "/colophon/") : "",
  ].filter(Boolean);

  return new Response(`${parts.join("\n\n---\n\n")}\n`, {
    headers: {
      ...markdownHeaders(),
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
