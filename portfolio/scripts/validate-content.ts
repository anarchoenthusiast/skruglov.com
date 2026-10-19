import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { siteConfig } from "../src/content/site";
import { homePageContent } from "../src/content/home";
import { projectsPageContent } from "../src/content/projects";
import { caseStudies } from "../src/content/case-studies";
import { caseStudiesDe } from "../src/content/case-studies/de";
import { validateContent } from "../src/lib/validate-content";
import { resolveThemeName } from "../src/theme/presets";
const errors = validateContent({ site: siteConfig, home: homePageContent.sections, projects: projectsPageContent.projects, studies: caseStudies, translations: caseStudiesDe }, (path) => existsSync(resolve("public", `.${path}`)));
try { resolveThemeName(process.env.SITE_THEME ?? siteConfig.appearance.theme); new URL(siteConfig.baseUrl); } catch (e) { errors.push(String(e)); }
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Content valid: ${projectsPageContent.projects.length} projects, ${Object.keys(caseStudies).length} case studies, two locales, assets and public links.`);
