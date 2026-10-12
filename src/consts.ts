import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Sergey Kruglov",
  EMAIL: "hello@skruglov.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_PROJECTS_ON_HOMEPAGE: 4,
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
  DESCRIPTION: "About Sergey Kruglov, a senior product designer building and scaling digital products, AI workflows, and cross-platform design systems.",
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
