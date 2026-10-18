# skruglov.com portfolio

Template: brightfutures-studio 0.1.0, pinned in template.lock.json.
Upstream release: https://github.com/anarchoenthusiast/brightfutures-site/releases/tag/brightfutures-template-v0.1.0

Identity, email and description were taken from the existing committed Astro portfolio's src/consts.ts. No old case study content or media has been converted yet. The sample project, logo, office and legal content are deliberate placeholders. Search indexing, splash and the contact form are disabled while authoring. Default appearance uses the Bright Futures preset; override tokens in src/content/site-data.ts or use the development style panel.

Edit the project-owned files listed in template.lock.json. Keep shared components, CSS, routes, types, presets, dependency manifests and updater code upstream-owned. Put custom fonts in public/fonts/project/ and media in public/images/ or public/project/. Publish a new upstream release for template improvements, then prepare and verify a separate update candidate. Do not merge the upstream Git repository into the Astro repository.

This package runs independently with npm ci followed by npm run dev -- --port 3016. Full verification: PLAYWRIGHT_CHANNEL=chrome npm run verify:template-consumer -- .

Next content work: replace the sample case with the existing approved portfolio content, set the home/project order, personalize office/contact/legal copy and brand media, then review public hosting/indexing. Existing Astro main and its deployment remain active until that separate switch.
