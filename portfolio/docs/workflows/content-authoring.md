# Content authoring

See [template customization](template-customization.md) for the current content and theme entry points.

Add a project in `src/content/projects.ts` with a unique URL-safe slug, local cover asset and positive dimensions. Set `published: true` to include it in public routes, the projects index, sitemap and LLM summaries. Drafts remain private to source files.

Register a case study in `src/content/case-studies/index.ts`. Optional German entries go in `case-studies/de/`; missing translations use the English case. A published project without a registered case uses the shared fallback.

The block union in `src/content/types.ts` is the authoring contract: `projectHero`, `largeIntro`, `fullWidthImage`, `twoColMedia`, `threeColMedia`, `twoColText`, `threeColText`, `ctaLink`, `credits`, `figmaSlide`, `slideVideo`, `projectNote`. A case has exactly one `projectHero`.

Use local media under `public/`. Site-wide typography and paint belong to theme tokens; project artwork and slide composition stay in case data. Do not duplicate page renderers to add content. Run `npm run validate:content` while authoring and `npm run check` before delivery.
