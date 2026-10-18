import type { HomeSection } from "@/content/types";
export const homePageContent = {
  "sections": [
    {
      "layout": "1-column",
      "whitespace": "s",
      "isFirst": true,
      "items": [
        {
          "type": "image",
          "src": "/images/sample.svg",
          "alt": "Sample project",
          "href": "/projects/sample-project/",
          "size": "xl",
          "width": 1200,
          "height": 800
        }
      ]
    }
  ]
} satisfies { sections: HomeSection[] };
