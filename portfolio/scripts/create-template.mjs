import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve, relative, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i+1]; };
if (!args[0] || args[0].startsWith("--")) throw new Error('Usage: npm run template:create -- <new-directory> [--name "Studio Name"] [--url https://example.com] [--email hello@example.com]');
const target = resolve(args[0]);
if (target === source || !relative(source,target).startsWith("..") || existsSync(target)) throw new Error("Choose a new directory outside this project. Existing directories are never overwritten.");
const name = option("--name", "Example Studio");
const url = new URL(option("--url", "https://example.com"));
if (!["https:","http:"].includes(url.protocol) || url.pathname !== "/" || url.username || url.password || url.search || url.hash) throw new Error("--url must be an HTTP(S) origin without a path, credentials or query.");
const email = option("--email", "hello@example.com");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid --email");
const write = (p, value) => { const path=join(target,p); mkdirSync(dirname(path),{recursive:true}); writeFileSync(path,value); };
const toModule = (key, value) => `export const ${key} = ${JSON.stringify(value,null,2)};\n`;
const description = `${name} — selected projects, ideas, and experiments.`;
mkdirSync(target,{recursive:false});
try {
  for (const file of ["package.json","package-lock.json","tsconfig.json","next.config.ts","postcss.config.mjs","eslint.config.mjs",".nvmrc",".gitignore",".env.example","AGENTS.md","template.manifest.json","template.release.json"]) cpSync(join(source,file),join(target,file));
  for (const dir of ["src","tests","docs"]) cpSync(join(source,dir),join(target,dir),{recursive:true, filter: p => !p.includes("design-references")});
  mkdirSync(join(target,"scripts"));
  for (const file of ["create-template.mjs","validate-content.ts","qa-smoke.mjs","audit-tokens.ts","qa-studio.mjs","qa-themes.ts","qa-devices.mjs","qa-picker.mjs","qa-media.mjs","template-release.mjs","verify-template-consumer.mjs","package-template-release.mjs"]) cpSync(join(source,"scripts",file),join(target,"scripts",file));
  cpSync(join(source,"scripts/lib"),join(target,"scripts/lib"),{recursive:true});
  const keepTypes = readFileSync(join(target,"src/content/types.ts"),"utf8");
  const localesSource = readFileSync(join(target,"src/content/locale-data.ts"),"utf8");

  rmSync(join(target,"src/content"),{recursive:true});
  write("src/content/types.ts", keepTypes);
  for (const file of ["site.ts","page-seo.ts","locales.ts"]) cpSync(join(source,"src/content",file),join(target,"src/content",file));
  cpSync(join(source,"src/content/media-viewer.ts"),join(target,"src/content/media-viewer.ts"));
  const site = {
    name,siteName:name,shortName:name,baseUrl:url.origin,language:"en",defaultTitle:description,defaultDescription:description,titleSuffix:name,copyrightRangeLabel:"© "+new Date().getFullYear(),
    appearance:{theme:"editorial",tokens:{}},features:{splash:false,contactForm:false,searchIndexing:false},
    header:{navItems:[{label:name,href:"/"},{label:"Studio",href:"/office/"},{label:"Projects",href:"/projects/"},{label:"Contact",href:"/contact/"}]},
    splash:{phrases:[name]},brand:{logo:{src:"/images/logo.svg",invertedSrc:"/images/logo-light.svg",alt:name,width:157,height:79}},
    footer:{logo:{href:"/"},aboutTitle:name,aboutBody:description,copyright:`© ${new Date().getFullYear()} ${name}`},
    contact:{companyName:name,email,telephone:"",postalAddress:{streetAddress:"",postalCode:"",addressLocality:"",addressCountry:""},addressLines:[],officeAddressLines:[name],contactLinks:[{label:"Inquiries",value:email,href:`mailto:${email}`}],socialLinks:[]},
    seo:{locale:"en_US",openGraphImage:{url:"/images/sample.svg",width:1200,height:800},icons:{icon:[{url:"/images/logo.svg",sizes:"any"}],apple:"/images/logo.svg"}},
  };
  write("src/content/site-data.ts", `import type {SiteDefinition} from "@/template/site-contract";\nexport const siteDefinition: SiteDefinition = ${JSON.stringify(site,null,2)};\n`);
  write("src/content/seo.ts",'import {siteConfig} from "@/content/site";\nexport const homeSeo = {en:{title:undefined,description:siteConfig.defaultDescription},de:{title:undefined,description:siteConfig.defaultDescription}};\n');
  cpSync(join(source,"src/content/project-fallback.ts"),join(target,"src/content/project-fallback.ts"));

  write("src/content/locale-data.ts",localesSource.replace(/de: \["Erkunden"[^\n]+/,'de: [siteConfig.name],').replace(/"Forschung, Innovation[^"\n]+"/,"siteConfig.footer.aboutBody"));
  const project={slug:"sample-project",client:name,name:"Sample project",category:"Design",year:new Date().getFullYear(),coverImage:"/images/sample.svg",coverWidth:1200,coverHeight:800,href:"/projects/sample-project/",published:true,featured:true};
  write("src/content/projects.ts",'import type { ProjectSummary } from "@/content/types";\n'+toModule("projectsPageContent",{title:"Projects",description,projects:[project]}).replace("export const projectsPageContent =", "export const projectsPageContent: {title:string;description:string;projects:ProjectSummary[]} ="));
  write("src/content/home.ts",'import type { HomeSection } from "@/content/types";\n'+toModule("homePageContent",{sections:[{layout:"1-column",whitespace:"s",isFirst:true,items:[{type:"image",src:"/images/sample.svg",alt:"Sample project",href:"/projects/sample-project/",size:"xl",width:1200,height:800}]}]}).replace(/;\n$/, ' satisfies { sections: HomeSection[] };\n'));
  write("src/content/case-studies/index.ts",'import type { CaseStudyEntry } from "@/content/types";\n'+toModule("caseStudies",{"sample-project":{slug:"sample-project",seoTitle:"Sample project",seoDescription:description,role:"Design",skills:["Research","Design"],blocks:[{kind:"projectHero",title:"Sample project"},{kind:"largeIntro",paragraphs:[{segments:["Describe the challenge, your approach, and the outcome here."]}]},{kind:"fullWidthImage",image:{src:"/images/sample.svg",alt:"Sample project",width:1200,height:800}}]}}).replace('export const caseStudies =','export const caseStudies: Record<string, CaseStudyEntry> ='));
  write("src/content/case-studies/de/index.ts",'import type { CaseStudyEntry } from "@/content/types";\nexport const caseStudiesDe: Record<string, CaseStudyEntry> = {};\n');
  // The grid extractor contains rendering logic and no brand content.
  cpSync(join(source,"src/content/project-grid-assets.ts"),join(target,"src/content/project-grid-assets.ts"));
  const office={title:"Studio",description,heroTitle:"Ideas into useful work",intro:"Introduce your studio and what you help people achieve.",about:"Tell your story here.",approach:"Describe your process and the way you work.",partners:[],locationLines:[name],inquiries:site.contact.contactLinks,socialLinks:[],services:[{title:"Research",body:"Understand the opportunity."},{title:"Design",body:"Develop and test a direction."},{title:"Delivery",body:"Bring the work into the world."}]};
  write("src/content/office.ts",toModule("officePageContent",office));
  const officeCopy={hero:office.heroTitle,intro:office.intro,about:office.about,approach:office.approach,services:"Services",partners:"Partners",inquiries:"Inquiries",location:"Location",contact:"Get in touch",serviceItems:office.services};
  write("src/content/office-locales.ts",toModule("officePageCopy",{en:officeCopy,de:{...officeCopy,partners:"Partner",inquiries:"Anfragen",location:"Standort",contact:"Kontakt"}}));
  const projectsCopy={title:"Projects",empty:"New work coming soon.",index:"Index",image:"Image",colProject:"Project",colPartner:"Partner",colType:"Type",colYear:"Year"};
  write("src/content/projects-locales.ts",'import type { Locale } from "@/content/locales";\nexport const projectCategoryLabels: Record<Locale, Record<string,string>> = {en:{},de:{}};\n'+toModule("projectsCopy",{en:projectsCopy,de:{...projectsCopy,title:"Projekte",image:"Bild",colProject:"Projekt",colType:"Typ",colYear:"Jahr"}}));
  const contact={title:"Let’s talk",body:"Tell us about your next project.",direct:"Or write to",privacyNote:"Learn how we process your data in our",privacyLink:"privacy policy"};
  const labels={name:"Name",email:"Email",message:"Your message",submit:"Send message",sending:"Sending…",success:"Thank you for your inquiry.",error:`Message could not be sent. Please write to ${email}.`};
  write("src/content/contact.ts",toModule("contactPageContent",{en:contact,de:{title:"Kontakt",body:"Erzählen Sie uns von Ihrem Projekt.",direct:"Oder schreiben Sie an",privacyNote:"Informationen zur Datenverarbeitung in unserer",privacyLink:"Datenschutzerklärung"}})+toModule("contactFormLabels",{en:labels,de:{...labels,email:"E-Mail",message:"Ihre Nachricht",submit:"Nachricht senden",sending:"Wird gesendet…",success:"Vielen Dank für Ihre Anfrage."}}));
  const legal={imprint:"Imprint",privacy:"Privacy",imprintSections:[{title:"Site operator",paragraphs:[name,`Email: ${email}`,"Replace this placeholder with the operator’s required legal information before publication."]}],privacySections:[{title:"Privacy information",paragraphs:["Replace this placeholder with the privacy information for your actual hosting, forms, and service providers before publication."]}]};
  write("src/content/legal.ts",toModule("legalPageContent",{en:legal,de:{...legal,imprint:"Impressum",privacy:"Datenschutz"}}));
  write("public/images/sample.svg",'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#e2dccd"/><circle cx="600" cy="400" r="220" fill="#879481"/><path d="M0 650L1200 150V800H0Z" fill="#bfbba9"/></svg>');
  for (const [file,color] of [["logo.svg","#292b21"],["logo-light.svg","#f4f0e7"]]) write(`public/images/${file}`,`<svg xmlns="http://www.w3.org/2000/svg" width="157" height="79" viewBox="0 0 157 79"><rect x="0" y="10" width="59" height="59" rx="29" fill="${color}"/><rect x="78" y="10" width="59" height="59" fill="${color}"/></svg>`);
  mkdirSync(join(target,"public/fonts"), {recursive:true});
  cpSync(join(source,"public/fonts/areal.woff2"), join(target,"public/fonts/areal.woff2"));
  rmSync(join(target,"src/app/favicon.ico"),{force:true});
  // Original identity faces use system fallbacks; the explicitly shared Areal preset remains available.
  const cssPath=join(target,"src/app/globals.css");
  writeFileSync(cssPath,readFileSync(cssPath,"utf8").replace(/@font-face \{[\s\S]*?\n\}/g,""));
  const pkg=JSON.parse(readFileSync(join(target,"package.json"),"utf8"));
  pkg.name=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "studio-template";
  pkg.description=description;write("package.json",JSON.stringify(pkg,null,2)+"\n");
  const lock=JSON.parse(readFileSync(join(target,"package-lock.json"),"utf8"));lock.name=pkg.name;lock.packages[""].name=pkg.name;write("package-lock.json",JSON.stringify(lock,null,2)+"\n");
  write("README.md",`# ${name}\n\nA clean studio template. Start with \`npm ci\`, then \`npm run check\` and \`npm run dev\`.\n\nEdit \`src/content/\` for all copy and project data. Choose a theme in \`src/content/site-data.ts\`. See \`docs/workflows/template-customization.md\`.\n\nSearch indexing and the contact form start disabled. Replace legal placeholders and configure your services before enabling them.\n`);
  console.log(`Created ${target}\nNo credentials, Git history, source references, client projects, source identity fonts, or provisioning scripts were copied.\nNext: cd "${target}" && npm ci && npm run check && npm run dev`);
} catch (error) { rmSync(target,{recursive:true,force:true}); throw error; }
