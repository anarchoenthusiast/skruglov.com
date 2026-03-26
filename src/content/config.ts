import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional()
  }),
});

const about = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
  }),
});

const colophon = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
  }),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    priority: z.number().optional(),
    role: z.string().optional(),
    duration: z.string(),
    company: z.string().optional(),
    scope: z.string().optional(),
    projectType: z.string(),
    contributions: z.string().optional(),
    collaborators: z.string().optional(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
    images: z.array(z.object({
      url: z.string(),
      alt: z.string()
    })).optional()
  }),
});

export const collections = { blog, about, colophon, projects };
