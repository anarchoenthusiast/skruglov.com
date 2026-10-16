import type { Site, Metadata, Socials } from "@types";

export const HOME_PROJECT_SLUGS = ["lalal-ai", "4k-download", "surrly"] as const;

export const SITE: Site = {
  NAME: "Sergey Kruglov",
  EMAIL: "hello@skruglov.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_PROJECTS_ON_HOMEPAGE: HOME_PROJECT_SLUGS.length,
};

export const HOME: Metadata = {
  TITLE: "Senior Product Designer",
  DESCRIPTION: "Sergey Kruglov is a senior product designer helping founders turn complex technology into clear, practical digital products, from research and prototyping to launch and monetisation.",
};

export const BLOG: Metadata = {
  TITLE: "Writing",
  DESCRIPTION: "Notes and essays by Sergey Kruglov on product design, technology, software, and the craft of building digital products.",
};

export const ABOUT: Metadata = {
  TITLE: "About",
  DESCRIPTION: "Sergey Kruglov is a senior product designer with 14+ years of experience designing software, building design systems and leading teams.",
};

export const COLOPHON: Metadata = {
  TITLE: "Colophon",
  DESCRIPTION: "Information about this website.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "Selected product design, AI, creator tools, and software projects by Sergey Kruglov.",
};

export const SOCIALS: Socials = [
  { 
    NAME: "twitter-x",
    HREF: "https://x.com/kryglovsergey",
  },
  { 
    NAME: "github",
    HREF: "https://github.com/anarchoenthusiast"
  },
  { 
    NAME: "linkedin",
    HREF: "https://www.linkedin.com/in/kruglovse/",
  }
];
