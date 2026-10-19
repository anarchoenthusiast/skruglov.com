# Existing source template

This is an existing Next.js site being maintained as a reusable template.
Do not run PagePilot capture, reconstruction, Layout IR, compose, or reference export workflows here.

Before changing components, read `docs/template-audit.md`, inspect the existing shared renderer, and run `npm run check` as a baseline.
Content belongs in `src/content/`. Theme choices and tokens belong in `src/theme/presets.ts` and `siteConfig.appearance`.
Page routes are thin adapters; shared renderers belong in `src/components/pages/`.
Never put a brand, address, mailbox, SVG logo shape, or font family into a shared component.
The header, footer, case-study blocks, contact states and themes are shared contracts. Fix their canonical implementation once.
Do not make a second page renderer for a new case study. Use the block union in `src/content/types.ts`.
Keep unpublished projects out of routes, navigation, the sitemap, and LLM summaries.
English and German use separate static root layouts so HTML language and metadata match the page.
Before delivery: `npm run check`, then `npm run qa:smoke -- <local-production-url>`.
Use `PLAYWRIGHT_CHANNEL=chrome` for an installed Chrome, or install Chromium with `npx playwright install chromium`.
Never send test contact emails to a real mailbox; test unconfigured/error states or use a dedicated local mail fixture.
Verify `template:create` into a new disposable directory after changing content contracts or template creation.
Never copy `.env*` secrets, `.git`, `.next`, `reference/`, client media, or provisioning scripts into a clean starter.

## Versioned consumers

Read `docs/workflows/template-releases.md` before installing or updating a consumer. Author identity/theme in `src/content/site-data.ts`; shared metadata and content operations are managed runtime. `template.release.json` lists project-owned data and asset paths. Keep template components, schemas, dependencies, styles and adapters upstream. Never replace a live consumer in place: prepare a new candidate, verify it, then promote it with its fresh receipt. Consumer packages live below the product repository root, keeping Git and the existing application outside the replaceable directory. Source package publication is separate from deployment of a consumer's content.
