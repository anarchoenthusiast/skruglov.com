import type { HomeSection } from "@/content/types";
export const homePageContent: {sections: HomeSection[]} = {
  "sections": [
    {
      "layout": "1-column",
      "whitespace": "s",
      "isFirst": true,
      "items": [
        {
          "type": "image",
          "src": "/project/lalal-ai/1.jpg",
          "alt": "LALAL.AI — stem selection interface",
          "href": "/projects/lalal-ai/",
          "size": "xl",
          "width": 1568,
          "height": 1046
        }
      ]
    },
    {
      "layout": "2-column",
      "whitespace": "m",
      "items": [
        {
          "type": "image",
          "src": "/project/typo-project/1.jpg",
          "alt": "4K Download apps interface redesign preview 1",
          "href": "/projects/4k-download/",
          "size": "l",
          "width": 1160,
          "height": 652
        },
        {
          "type": "image",
          "src": "/project/surrly/1.png",
          "alt": "Surrly — dream journal home screen",
          "href": "/projects/surrly/",
          "size": "l",
          "width": 1920,
          "height": 1280
        }
      ]
    }
  ]
};
