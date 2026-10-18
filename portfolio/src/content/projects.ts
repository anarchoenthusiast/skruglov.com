import type { ProjectSummary } from "@/content/types";
export const projectsPageContent: {title:string;description:string;projects:ProjectSummary[]} = {
  "title": "Projects",
  "description": "Sergey Kruglov — selected projects, ideas, and experiments.",
  "projects": [
    {
      "slug": "sample-project",
      "client": "Sergey Kruglov",
      "name": "Sample project",
      "category": "Design",
      "year": 2026,
      "coverImage": "/images/sample.svg",
      "coverWidth": 1200,
      "coverHeight": 800,
      "href": "/projects/sample-project/",
      "published": true,
      "featured": true
    }
  ]
};
