import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://skruglov.com",
  integrations: [
    mdx(),
    sitemap({
      customPages: [
        "https://skruglov.com/llms.txt",
        "https://skruglov.com/llms-full.txt",
      ],
    }),
    tailwind(),
  ],
  devToolbar: {
    enabled: false,
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
  },
});
