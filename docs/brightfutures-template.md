# Bright Futures template in skruglov.com

The new portfolio is an independent Next.js package in `portfolio/` on `feat/brightfutures-template`. The original Astro site stays at the repository root and the Netlify configuration still builds it. This work starts from the committed `origin/main`; uncommitted work in another checkout is not part of this branch and is not modified.

Upstream: https://github.com/anarchoenthusiast/brightfutures-site/releases/tag/brightfutures-template-v0.1.0

The initial package pins `brightfutures-studio@0.1.0`. `template.lock.json` and `verification/template-lineage.json` record its exact digest and source commit. Name, URL and contact are seeded from the existing portfolio's `src/consts.ts`: Sergey Kruglov, https://skruglov.com, hello@skruglov.com. The sample project/office/legal copy and neutral media are explicit starting points for adaptation; existing Astro cases are not silently converted. Search indexing and sending contact mail remain disabled.

```sh
cd portfolio
npm ci
npm run dev -- --port 3016
```

Edit `src/content/site-data.ts` for identity, feature switches and `appearance.theme`/token overrides. Edit `home.ts`, `projects.ts`, `case-studies/`, `seo.ts`, `locale-data.ts`, office/contact/legal/interface data for content. Put artwork in `public/images/` or `public/project/`, custom fonts under `public/fonts/project/`. Project notes and migration decisions belong in `PROJECT.md`. Components, CSS, schemas, adapters, updater scripts and dependency manifests remain upstream-owned. The source style panel is available in development via Styles / Shift+D.

## Updating

Download the next upstream GitHub Release archive and SHA256 file into a temporary folder, verify the checksum, extract and verify its release manifest. The current release's complete instructions and ownership boundary are in `portfolio/docs/workflows/template-releases.md`.

From the installed package:

```sh
npm run template:release -- plan /absolute/releases/NEXT /absolute/skruglov.com/portfolio
npm run template:release -- prepare /absolute/releases/NEXT /absolute/skruglov.com/portfolio /absolute/skruglov.com/portfolio-next
cd ../portfolio-next
npm ci
PLAYWRIGHT_CHANNEL=chrome npm run verify:template-consumer -- .
# Stop the owned portfolio development server before replacing its directory.
npm run template:release -- promote /absolute/skruglov.com/portfolio-next /absolute/skruglov.com/portfolio
```

The new candidate preserves authored content, theme overrides, media, extra project files and deliberate seed deletions. It blocks runtime edits/collisions and demands explicit admission for route/schema changes. Promotion requires a fresh full check and responsive route receipt, detects concurrent target changes, and retains a `.previous-*` backup. Commit the updated package/lock/lineage on a project branch. Hosting/process environment holds credentials outside the portable package. No automatic merge or public deploy is performed by an update.

The new site is ready for content work on this branch. Switching the public skruglov.com build to Next.js is a separate publication step after content and hosting are reviewed.

## Beta hosting

The separate Netlify site [skruglov-beta](https://app.netlify.com/projects/skruglov-beta) uses this same repository and the `feat/brightfutures-template` branch. Its site ID is `582c6145-0194-44a3-bada-84557ed50980`, in team `anarchoenthusiast` (`skruglov`). Set **Base directory** and **Package directory** to `portfolio`, **Build command** to `npm run build`, and **Publish directory** to `.next` (relative to the base directory). Set the site's `build_settings.configuration_file_path` explicitly to `portfolio/netlify.toml`: the initial API-provisioned build otherwise selected the root Astro configuration despite its package/base settings. Node 24 is selected by the package's `.nvmrc` and the build configuration. The independent config explicitly enables the current `@netlify/plugin-nextjs` adapter; without it, a raw `.next` upload can finish successfully while every public route returns 404. The root `netlify.toml` continues to serve the existing Astro site.

The beta build sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`, and `siteDefinition.features.searchIndexing` remains false. This prevents search indexing; it is not access control. No SMTP credentials or form delivery are required while `contactForm` is false. Keep the beta's content edits on this branch and review them before the production switch.

After the separate site has a successful Next.js deployment, attach `beta.skruglov.com` to that site and use Netlify's generated DNS values. Export/re-read the existing DNS zone before adding any record, preserve existing website and email records, and verify HTTPS, the rendered Next.js content and the robots header on the custom hostname. A successful Astro deploy preview for this PR does not verify the new portfolio.

Before publishing the new portfolio at `skruglov.com`, review the remaining placeholders, old URL coverage/redirects and contact behavior. Remove the beta indexing restrictions from the production configuration only when ready, and set `features.searchIndexing` to true. Retain a rollback deployment of the current Astro site. Switching the primary domain or production build is a separate release decision.

## Verification of the initial installation

The published archive was downloaded back from GitHub and its outer checksum and payload digest verified. The personalized package passes the full native check (14 template tests, 20 release/update tests, strict token audit, content validation, lint, types and production build) plus 42 route/viewport cases over all 14 routes at 390/884/1440px. Desktop home and phone case screenshots were visually reviewed. An independent roundtrip preserves identity, the selected Bright Futures theme, content, media and project notes; a deliberately edited component is rejected as runtime drift. Evidence is in `docs/verification/brightfutures-installation.json` and the package's verification receipts.

The original Astro build passes with 14 pages. Its root lint currently has two existing errors in unchanged files: `scripts/sync-tokens.js:77` (`no-inner-declarations`) and `src/components/ProjectFigmaSlide.astro:34` (`no-unused-vars`). These are separate from the passing native package checks.
