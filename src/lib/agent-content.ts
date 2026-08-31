import type { CollectionEntry } from "astro:content";
import { SITE, HOME } from "@consts";

export function mdxBodyToMarkdown(body: string): string {
  return body
    .replace(/^import\s.+;?\s*$/gm, "")
    .replace(/<ProjectNote>([\s\S]*?)<\/ProjectNote>/gi, (_match, inner: string) => {
      const text = stripJsx(String(inner)).trim();
      return text ? `\n> ${text.replace(/\n+/g, " ").trim()}\n` : "";
    })
    .replace(/<Image\b[^>]*\balt="([^"]*)"[^>]*\/>/gi, "\n![$1]()\n")
    .replace(/<ProjectSlideVideo\b[\s\S]*?\/>/gi, (match) => {
      const alt = /alt="([^"]*)"/.exec(match)?.[1];
      const description = /description="([^"]*)"/.exec(match)?.[1] ?? alt;
      return description ? `\n**Video.** ${description}\n` : "";
    })
    .replace(/kind:\s*"video"[\s\S]*?alt:\s*"([^"]*)"/gi, "\n**Video.** $1\n")
    .replace(/<ProjectFigmaSlide\b[\s\S]*?\/>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripJsx(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
}

export function projectToMarkdown(project: CollectionEntry<"projects">): string {
  const title = project.data.pageTitle ?? project.data.title;
  const lines = [
    `# ${title}`,
    "",
    project.data.description,
    "",
    `- Role: ${project.data.role ?? "n/a"}`,
    `- Company: ${project.data.company ?? "n/a"}`,
    `- Project type: ${project.data.projectType}`,
    `- Duration: ${project.data.duration}`,
    `- Scope: ${project.data.scope ?? "n/a"}`,
    `- Contributions: ${project.data.contributions ?? "n/a"}`,
    project.data.demoURL ? `- Live: ${project.data.demoURL}` : null,
    project.data.repoURL ? `- Repository: ${project.data.repoURL}` : null,
    `- Canonical page: https://skruglov.com/projects/${project.slug}/`,
    "",
    mdxBodyToMarkdown(project.body),
  ].filter((line): line is string => line !== null);

  return `${lines.join("\n")}\n`;
}

export function postToMarkdown(post: CollectionEntry<"blog">): string {
  return [
    `# ${post.data.title}`,
    "",
    post.data.description,
    "",
    `Published: ${post.data.date.toISOString().slice(0, 10)}`,
    `Canonical page: https://skruglov.com/blog/${post.slug}/`,
    "",
    mdxBodyToMarkdown(post.body),
    "",
  ].join("\n");
}

export function pageToMarkdown(entry: CollectionEntry<"about"> | CollectionEntry<"colophon">, path: string): string {
  return [
    `# ${entry.data.title}`,
    "",
    entry.data.description,
    "",
    `Canonical page: https://skruglov.com${path}`,
    "",
    mdxBodyToMarkdown(entry.body),
    "",
  ].join("\n");
}

export function buildLlmsIndex(input: {
  projects: CollectionEntry<"projects">[];
  posts: CollectionEntry<"blog">[];
}): string {
  const projectLines = input.projects
    .map((project) => `- [${project.data.title}](https://skruglov.com/projects/${project.slug}.md): ${project.data.description}`)
    .join("\n");
  const postLines = input.posts
    .map((post) => `- [${post.data.title}](https://skruglov.com/blog/${post.slug}.md): ${post.data.description}`)
    .join("\n");

  return `# ${SITE.NAME}

> ${HOME.DESCRIPTION}

This is the machine-readable index for https://skruglov.com — the portfolio of product designer and engineer Sergey Kruglov. HTML pages are canonical for humans. Markdown files linked below are intended for LLM and agent consumption.

Contact: ${SITE.EMAIL}

## Projects

${projectLines}

## Writing

${postLines}

## Pages

- [Home](https://skruglov.com/index.md): ${HOME.DESCRIPTION}
- [About](https://skruglov.com/about.md): About Sergey Kruglov
- [Colophon](https://skruglov.com/colophon.md): How this website is made
- [Projects index](https://skruglov.com/projects.md): Selected product design work

## Optional

- [Full site text](https://skruglov.com/llms-full.txt): Concatenated markdown of projects, writing, and about
- [RSS](https://skruglov.com/rss.xml)
- [Sitemap](https://skruglov.com/sitemap-index.xml)
`;
}

export function buildHomeMarkdown(input: {
  projects: CollectionEntry<"projects">[];
  posts: CollectionEntry<"blog">[];
}): string {
  const projectLines = input.projects
    .map((project) => `- [${project.data.title}](https://skruglov.com/projects/${project.slug}/): ${project.data.description}`)
    .join("\n");
  const postLines = input.posts
    .map((post) => `- [${post.data.title}](https://skruglov.com/blog/${post.slug}/): ${post.data.description}`)
    .join("\n");

  return `# ${SITE.NAME}

${HOME.DESCRIPTION}

Canonical page: https://skruglov.com/

## Selected projects

${projectLines}

## Latest writing

${postLines}

## Contact

${SITE.EMAIL}
`;
}

export function markdownHeaders(): HeadersInit {
  return {
    "Content-Type": "text/markdown; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  };
}
