# Versioned Bright Futures Studio template

The reusable source is `anarchoenthusiast/brightfutures-site`. Published versions use tags such as `brightfutures-template-v0.1.0` and an asset named `brightfutures-studio-0.1.0.tar.gz`, with a separate `.sha256` file. A release contains neutral sample content, not the Bright Futures client work. It is a portable Next.js package, not an npm dependency. Node 24+ is required. The source repository's default branch and feature PR do not need to be merged into a consumer.

## Ownership

`template.release.json` is the exact boundary. The product owns `src/content/site-data.ts` (identity, URL, contact, features, theme and token overrides), home/projects/case documents, `seo.ts`, `locale-data.ts`, office/contact/legal/interface copy, `public/images/`, `public/project/`, `public/fonts/project/` and `PROJECT.md`. Keep custom fonts and artwork in those asset namespaces. Deliberately deleted project seeds remain deleted. Newly introduced seeds are explicit additions in the plan.

The template owns components, theme presets and token API, CSS, routes, type schemas, metadata/localization/content operations, dependency manifests, tests and updater scripts. Do not edit these in a consumer: submit the improvement upstream and issue another template version. A local runtime edit/deletion blocks an update rather than being overwritten. New runtime files colliding with project files also block the update. TypeScript/content validation checks authored data against the incoming runtime; a release does not silently migrate incompatible documents.

Content operations now live in `src/lib/content.ts`, metadata behavior in `src/content/site.ts` and `page-seo.ts`, and locale operations in `locales.ts`. Their data adapters remain separately editable. This allows behavioral fixes without replacing project data.

## Download and verify

Download the archive and matching checksum from the release. With an authenticated GitHub CLI:

```sh
gh release download brightfutures-template-v0.1.0 --repo anarchoenthusiast/brightfutures-site --pattern 'brightfutures-studio-0.1.0.tar.gz*' --dir /tmp/brightfutures-download
cd /tmp/brightfutures-download
shasum -a 256 -c brightfutures-studio-0.1.0.tar.gz.sha256
tar -xzf brightfutures-studio-0.1.0.tar.gz
node 0.1.0/payload/scripts/template-release.mjs verify 0.1.0
```

The outer checksum checks transport; `verify` independently checks the release manifest digest, complete payload hashes and source build/QA lineage. Keep the archive or retrieve it by its immutable version. Never edit a frozen release folder.

## First installation

Use a new package directory such as `portfolio/` inside an existing repository. Its Next.js dependencies and build stay independent of an existing Astro/application root. The updater rejects a Git repository root as its destination.

```sh
node /tmp/brightfutures-download/0.1.0/payload/scripts/template-release.mjs prepare /tmp/brightfutures-download/0.1.0 /absolute/product/portfolio /absolute/product/portfolio-candidate
cd /absolute/product/portfolio-candidate
npm ci
# Edit project-owned files here, including site-data.ts and PROJECT.md.
PLAYWRIGHT_CHANNEL=chrome npm run verify:template-consumer -- .
npm run template:release -- promote /absolute/product/portfolio-candidate /absolute/product/portfolio
cd /absolute/product/portfolio
npm run dev -- --port 3016
```

`verify:template-consumer` runs the complete native check (content, tests, token audit, lint, types, production build), then checks all declared routes at 390/884/1440px for browser errors, overflow, collapsed sections, loaded images and local destinations. Promotion requires that exact fresh receipt and unchanged target inputs. It moves whole directories and retains the old package as a `.previous-*` recovery folder. Stop the consumer's owned server before promotion; restart afterward. The updater does not stop user processes.

`template.lock.json` pins the template identity, version, digest, schema, routes, runtime hashes and project seed history. Commit it with `verification/template-lineage.json`. Build/smoke receipts are evidence of integration, not automatic approval of the product's copy or public launch. Search indexing and the contact form remain disabled in a new site until deliberately configured. Set deployment secrets in the hosting/process environment, outside the portable consumer graph; actual `.env*` credential files are refused by the release transport. The public `.env.example` is allowed.

## Update a consumer

Download/verify the next version, then run from the installed package:

```sh
npm run template:release -- plan /absolute/releases/0.2.0 /absolute/product/portfolio
npm run template:release -- prepare /absolute/releases/0.2.0 /absolute/product/portfolio /absolute/product/portfolio-next
cd /absolute/product/portfolio-next
npm ci
PLAYWRIGHT_CHANNEL=chrome npm run verify:template-consumer -- .
npm run template:release -- promote /absolute/product/portfolio-next /absolute/product/portfolio
```

Review the plan before promotion. Project data, local token overrides, custom media, additional project files and seed deletions survive. The candidate is independent: failed validation cannot alter the installed package. Route/API/ownership changes require explicit admission (`--routes=...`, `--schema-version=N`, `--ownership=extend`) and a reviewed content migration; these flags cannot skip the build or smoke tests. Resolve template code changes upstream instead of weakening drift detection.

## Publish the next version

Commit source changes, then run:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run template:package -- 0.2.0 /absolute/releases/0.2.0
```

`GIT_BIN` can select a working Git executable. The command refuses dirty source and existing destinations, generates an independent neutral starter, installs its locked dependencies, runs full native checks and production page/gallery QA with SMTP disabled, hashes the accepted graph and freezes the release. Its original receipt, route/build lineage, repository commit and acceptance limits travel with the package. Bump `schemaVersion` in the recipe when the authored API requires migration. No package path may contain secrets, Git/build folders or symlinks.

Archive the frozen directory, write its SHA256 checksum, tag the recorded source commit, and publish both assets through a GitHub Release. The vendored transport and native adaptations are recorded in `docs/template-release-provenance.json`; its synthetic tests cover real version transitions, data/theme/media preservation, deletion history, runtime drift, tampering, route/schema admission and promotion races.
