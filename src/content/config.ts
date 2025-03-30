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

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    role: z.string(),
    duration: z.string(),
    company: z.string(),
    scope: z.string(),
    contributions: z.string(),
    collaborators: z.string(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
    images: z.array(z.object({
      url: z.string(),
      alt: z.string()
    })).optional()
  }),
});

export const collections = { blog, about, projects };
