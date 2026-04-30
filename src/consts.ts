import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Sergey Kruglov",
  EMAIL: "hello@skruglov.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Product Designer and Engineer",
  DESCRIPTION: "Sergey Kruglov is a product designer and engineer helping founders turn complex technology into clear, practical digital products.",
};

export const BLOG: Metadata = {
  TITLE: "Writing",
  DESCRIPTION: "Notes and essays by Sergey Kruglov on product design, technology, software, and the craft of building digital products.",
};

export const ABOUT: Metadata = {
  TITLE: "About",
  DESCRIPTION: "About Sergey Kruglov, a product designer and engineer with 14+ years of experience building and scaling digital products.",
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
