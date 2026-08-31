import type { APIRoute } from "astro";

const robotsTxt = `
User-agent: *
Allow: /

# Machine-readable content for search engines and AI agents
# https://skruglov.com/llms.txt
# https://skruglov.com/llms-full.txt

Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();

export const GET: APIRoute = () => {
  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
