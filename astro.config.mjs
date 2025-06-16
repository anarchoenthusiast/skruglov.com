import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://astro-nano-demo.vercel.app",
  integrations: [mdx(), sitemap(), tailwind()],
  devToolbar: {
    enabled: false,
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
        // Настройки для максимального качества
        jpeg: {
          quality: 95,
          progressive: true,
        },
        webp: {
          quality: 95,
          effort: 6, // Максимальные усилия для лучшего сжатия
        },
        avif: {
          quality: 90,
          effort: 6,
        },
        png: {
          quality: 95,
          effort: 10, // Максимальное качество PNG
        },
      },
    },
  },
});
