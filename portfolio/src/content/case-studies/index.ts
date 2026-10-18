import type { CaseStudyEntry } from "@/content/types";
export const caseStudies: Record<string, CaseStudyEntry> = {
  "sample-project": {
    "slug": "sample-project",
    "seoTitle": "Sample project",
    "seoDescription": "Example Studio — selected projects, ideas, and experiments.",
    "role": "Design",
    "skills": [
      "Research",
      "Design"
    ],
    "blocks": [
      {
        "kind": "projectHero",
        "title": "Sample project"
      },
      {
        "kind": "largeIntro",
        "paragraphs": [
          {
            "segments": [
              "Describe the challenge, your approach, and the outcome here."
            ]
          }
        ]
      },
      {
        "kind": "fullWidthImage",
        "image": {
          "src": "/images/sample.svg",
          "alt": "Sample project",
          "width": 1200,
          "height": 800
        }
      }
    ]
  }
};
