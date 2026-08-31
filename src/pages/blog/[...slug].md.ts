import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { markdownHeaders, postToMarkdown } from "@lib/agent-content";

export async function getStaticPaths() {
  const posts = (await getCollection("blog")).filter((post) => !post.data.draft);
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: CollectionEntry<"blog"> };
  return new Response(postToMarkdown(post), {
    headers: markdownHeaders(),
  });
};
