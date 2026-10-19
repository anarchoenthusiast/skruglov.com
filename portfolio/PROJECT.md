# skruglov.com portfolio

Template: brightfutures-studio 0.1.0, pinned in template.lock.json.
Upstream release: https://github.com/anarchoenthusiast/brightfutures-site/releases/tag/brightfutures-template-v0.1.0

## Production content migration

The source is the actual Astro production deployment `6ad2431b691ebe70d41dd200`, commit `0f270889f67bbc96c77dc063f6a07ea09d553276`, verified on 19 October 2026. Uncommitted work in the main checkout, including the expanded LALAL.AI case, is excluded.

Eight published cases are registered: Surrly, Vana, 4K Download, LALAL.AI, Waveroom, Combin, Flipp and Ai Video Cut. The 4K Download Site, Corporelle and Intervals drafts remain excluded. The seed sample case is removed from authored content. Project descriptions, notes, original images, video/poster bytes and slide geometry are mapped to the existing case-study block union. Roles, work periods, scope and collaborators appear in Project details; published external project, award and press links are retained. Index years come from the source frontmatter dates, while full work periods are preserved in the case credits. Original slugs remain unchanged.

The homepage uses the three production-selected cases: LALAL.AI, 4K Download and Surrly. The footer uses the first paragraph of the published homepage contact section. Its description is shared across both locale views.

Studio is a first content adaptation of the published About page, using the existing renderer: the published introduction, selected work/contact/Berlin columns, the experience overview, independent-practice paragraph, and three career cards for LALAL.AI, 4K Download and independent projects. Names in Selected work are a portfolio list, not a claim that every product was a client. The existing CV remains linked at https://skruglov.com/cv/eng.pdf. English source text remains in both locale views; no German translation is claimed. Layout and components are unchanged.

The source-to-asset inventory and copy decisions are in `../docs/verification/production-content-migration.json`. Source media are copied into `public/project/`; no production MDX, scripts or credentials enter the published assets.

## Authoring and updates

Edit the project-owned files listed in template.lock.json. Keep shared components, CSS, routes, types, presets, dependency manifests and updater code upstream-owned. Put custom fonts in public/fonts/project/ and media in public/images/ or public/project/. Publish a new upstream release for template improvements, then prepare and verify a separate update candidate. Do not merge the upstream Git repository into the Astro repository.

The package runs with npm ci followed by npm run dev -- --port 3016. Native checks: npm run check. The stock consumer verifier's frozen route list includes the starter sample slug; content-driven route coverage must also use the actual eight published slugs after replacing the seed case.

## Hosting and remaining work

Beta: https://beta.skruglov.com, Netlify project skruglov-beta, Git branch feat/brightfutures-template. Search indexing, splash and the contact form remain disabled. Default appearance remains the Bright Futures preset.

Studio copy is a reviewable first adaptation. Contact/legal details beyond published facts remain outside this migration. The existing 320px header overflow is a template issue for an upstream update. Existing Astro main and its deployment remain active until an explicitly requested production switch.
