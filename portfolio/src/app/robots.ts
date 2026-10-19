import type { MetadataRoute } from "next";
import { isSearchIndexingBlocked, siteConfig } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  if (isSearchIndexingBlocked) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${siteConfig.baseUrl}/sitemap.xml`,
  };
}
