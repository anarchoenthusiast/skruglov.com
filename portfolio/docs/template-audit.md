# Existing-source template audit

Scope: adapt the existing source into a reusable studio/portfolio template. This is not a reconstruction.

## Baseline

The original checkout passes lint, TypeScript and a production build. Content already includes typed case-study blocks, English/German routes, a project registry and static generation.

## Findings and changes

| Finding | Template behavior |
| --- | --- |
| Hardcoded SVG logo ignores configured image | Shared logo renders configured normal/inverted assets |
| Body, footer, forms and case-study typography repeat literal paint | Semantic token API, three presets and typed overrides |
| Contact, legal, German office and projects copy live in components | All authoring copy moved to `src/content/` |
| Shared page renderers exported from route files | Routes delegate to canonical renderers in `components/pages/` |
| German alternate links can contain `/de/de/` | Idempotent locale paths, matching canonical/hreflang |
| German HTML inherits `lang=en` | Separate static locale root layouts |
| Language control drops current route and disappears on mobile | Current-route language switching at phone widths |
| Unpublished projects accessible by direct URL | Static route allowlist and publication guard |
| SMTP host, sender and recipient bound to one company | Configurable SMTP and recipient, legacy deployment variables accepted |
| No content-level validation | Link, publication, slug, asset, dimensions, block-heading checks |
| Reuse requires copying real company content | Clean starter generator with a sample case and neutral local SVG media |
| Splash and autoplay ignore motion preferences | Optional splash, no-JS content access, reduced-motion handling |
| No AI-readable site index | Generated `/llms.txt` and `/llms-full.txt` from published data |

## Ownership

Content slots: `src/content/`. Theme: `src/theme/presets.ts`. Shared layout: `src/components/`. Routes only wire locale, metadata and params. See `template.manifest.json` for machine-readable entry points.

Per-case slide composition colors are content/artwork and remain attached to their blocks. Changing the site theme does not recolor project media. The existing visual identity is the default; this work does not assert pixel-identical reconstruction.

## Release evidence

Verified locally on 2026-10-18 against baseline `e15bb1a4d02df582c5e7ab5638549da4a4ac99be`:

- `npm run check`: content validation, 8 regression tests, lint, generated route types, TypeScript, production build — PASS.
- Created a fresh Northstar Studio using only `template:create`, a different origin/mailbox, one generic case, system fonts and the editorial theme. Installed with `npm ci` and ran its complete `npm run check` — PASS. Source company/client media, references, identity fonts, secrets and provisioning scripts are absent. The clean starter now also includes the shared Areal preset face.
- Production browser matrix on each project: 6 basic pages × 2 locales × 3 widths (1440/390/320) = 36 checks per project, 72 total — PASS. Each width also exercises image/index project views, keyboard tabs, a project detail page, same-route language switching, heading/landmark counts, horizontal overflow, header down/up scroll, and browser error collection.
- Contact success/error UI uses mocked delivery responses. Malformed input, missing credentials/disabled form and unknown project paths are also probed. No real email delivery was attempted.
- Default, midnight and independent editorial presentations were visually inspected. Rest/down/up header behavior was also inspected in the live in-app browser.
- Canonical and language links, static `lang`, unpublished route guards, local asset references and generated LLM endpoints are checked. This is a source-template adaptation; no reference reconstruction pixel-parity claim is made.
- Homepage local Chrome observations without CPU/network throttling: LCP 44–76 ms across both projects and desktop/phone, CLS at most 0.000003, observed long-task blocking 0 ms. These are local diagnostic readings, not deployed/field Core Web Vitals certification.

Browser reports/screenshots are retained locally under `.qa/` (ignored by Git). Continuous checks are defined in `.github/workflows/template.yml`; remote CI status must be reviewed on the PR.

## Live token QA (2026-10-18)

Development now includes the shared DialKit settings pattern: Shift+D / Styles / `?studio=1`. The panel edits all 37 canonical tokens, supports presets, grouped undo/redo/reset, local persistence across routes and locale root layouts, and theme JSON/CSS import/export. Normal production omits the editor; `ENABLE_TEMPLATE_STUDIO=true` explicitly enables a QA preview at build time.

The generated source audit reports 117/203 scoped authored design declarations using variables (57.6%), all 37 canonical tokens referenced, and 86 remaining hardcoded declarations. This is a scoped declaration metric, not a full visual coverage percentage. Project artwork, image pixels, SVG paths, pseudo-elements and third-party/editor styles are excluded. Per-token probes temporarily change a value, mark responding HTML elements, and restore the original value; transition settling is disabled during the probe to avoid false zero results.

The live browser check covers unchanged paint on opening, typography, font selection, presets, history, import/export, reload and language persistence, source report, probe restoration (including body canvas), independent phone typography, panel fit, and exit restoration. The same editor check runs on the clean generated starter. Source and clean starter each pass 8 tests, lint, TypeScript and production builds. Local screenshots and browser results are in `.qa/studio/`.

## Complete template tokens and Are.na presets

The shared template design contract now has 99 referenced tokens. The expanded audit covers 236/236 authored design declarations (100%), including typography, spacing, colors, borders, focus, opacity and transitions; there are zero remaining literal design gaps in that scope. Strict auditing blocks a newly hardcoded design value or an unreferenced canonical token. A negative fixture verifies this failure path. Layout/media geometry, project artwork, image pixels, screen-reader clipping and reduced-motion safety overrides are explicit fixed contracts rather than recolorable template paint.

Are.na Light, Dark, Dawn and Dusk are imported from the neighboring Granola-derived studio package. The independent Are.na Areal typography preset transfers the local font and source leading multipliers while retaining this template's type-size hierarchy. Color presets preserve typography/layout; typography presets preserve color/layout. Placeholder, focus, normal/hover control paint and inverse-footer logo treatment have distinct semantic roles. Mapping and provenance: `arena-presets-source.json`.

Fluid size and spacing expressions now use native numeric folders (Adaptive/Fixed, minimum px, viewport vw, maximum px, fixed px). Common fonts, sizes and layout controls appear first. Existing raw CSS size fields and saved versions migrate locally with a backup. Long words wrap in shared text components when font changes would exceed narrow columns.

Verification commands: `npm run check`, `npm run qa:studio`, `npm run qa:themes`, production `npm run qa:smoke`, and a fresh `template:create` proof. Theme QA covers all four palettes with Areal at 1440/390/320 in both locales, six route types, and real placeholder/focus/hover states without submitting mail. Reports and screenshots stay in `.qa/themes/` and `.qa/studio/`.

Final local evidence: 11 regression tests, lint, TypeScript, strict token auditing and production builds pass for source and a fresh Northstar starter. The final source theme matrix passes 144 cases; normal production smoke passes 36 cases per project. Live studio QA covers numeric controls, independent presets and legacy saved-value/version migration. No test email was sent.


## Semantic role follow-up

The active contract now has 88 canonical tokens and 217/217 scoped declarations using tokens, with zero source gaps. Titles, lead paragraphs and body/interface fonts have independent bindings. Near-duplicate legal typography, caption/mobile type, weights and header language sizes are consolidated. See `semantic-style-audit.md` for the migration map, local font workflow and QA coverage. Earlier token totals above describe prior stages.


## Global device preview

Desktop/Mobile now selects the visible token controls and a matching real viewport. A single primary Size slider replaces the desktop/mobile pair; Adaptive/Fixed details remain available. Hidden controls retain their canonical values. The host uses public DialKit Folder, ButtonGroup, Slider, ControlRenderer and PresetManager APIs with the existing store/persistence. Preview frames synchronize same-origin theme/font updates and cannot recursively mount a Studio. `qa:devices` covers the new responsive behavior.

Final device-mode evidence: source and fresh Northstar starter pass all 14 regression tests, strict token auditing, lint, TypeScript and production builds. Both pass `qa:devices`, including the exact reported 132px mobile title case, independent desktop values, real viewport widths, local fonts, history, reload, navigation and preview probes. The existing live Studio regression also passes on source. Production smoke passes 36 route/viewport cases on each project. No real test email was sent.


## Page-to-settings selection

The open Studio can now select supported elements directly on the page or in a responsive preview. Picking opens and highlights their canonical settings folders; related role settings remain one click away. Hover/selection outlines are editor-only, and selecting does not mutate theme values. Escape, pausing or closing the panel restores normal interactions. Hidden editor file inputs are explicitly excluded; the collapsed native Folder retains a visible accessible click target. `qa:picker` covers selection and normal-interaction restoration alongside the existing Studio/device scenarios.

Final selection evidence: source and a freshly generated Northstar starter pass all 14 regression tests, strict token audit, lint, TypeScript, production builds and `qa:picker`. Source also passes the full Studio and device suites. Production smoke passes 36 route/viewport cases per project (72 total). Computer-use inspection confirmed footer text opens Body & interface settings; desktop/mobile screenshots are retained under `.qa/picker/`. Contact delivery remains mocked; no real mail was sent.


## Focused inspector and tablet Body correction

The active UI has separate All styles and Select layer modes. All styles uses native DialKit Folders with library surface/border tokens to separate groups. Select layer filters the canonical controls to the selected semantic element and its actual inherited styles; it omits Related styles and forward-inspection actions. Static home media, case assets and project cards now share editable outer frame corners; internal slide artwork remains a content contract. The custom host retains public DialKit primitives and adds header dragging with viewport bounds, tab persistence and a reset grip.

Removed tablet-only mobile Body overrides at 768–1023px so the selected Desktop size controls header, fields, regular text, footer and project index consistently. Device and typography now use the same 768px split. The strict source audit is 216/216 declarations (100%), 88 referenced tokens and zero gaps.

Final focused-inspector evidence: source and a fresh Northstar starter pass 14 regression tests, lint, TypeScript, strict token auditing, production builds and the revised `qa:picker` suite (including keyboard position controls). Source Studio and device suites pass. Production smoke passes 36 cases per project, 72 total. Local proof is under `.qa/picker/`. No real contact email was sent. CI now includes the device and focused-inspector browser suites.


## Template media gallery

The lazy viewer opens only case-study media; covers and Projects Image tiles keep project links. It mounts on project detail pages with a server-built catalog of published projects, using the same block descriptors as the page renderer. Original media loads on demand. Unpublished projects and index covers do not enter the catalog.

The unringed i panel starts hidden. Caption and localized project/year/role/skills follow the active asset. The configured studio name is top left and close top right. Playback/counter/arrows remain bottom center; binary paper stays bottom left; i sits immediately before the bottom-right heart. View project aligns beside the bottom-right heart when details are open; narrow layouts move this action pair together to a second row. These positions and visibility are tested on 1440/390/320 widths. Caption/credits scroll independently of the project button; expanding preserves media, paper, slideshow and Like state.

Both directions and the five-second slideshow use one continuous circle: last media of one project → first media of the next, then last project → first. The per-project counter, caption, metadata and destination link change together. The underlying page/scroll and original focus target remain in place until View project is chosen. Only a single total slide disables navigation. A generated single-project starter retains the same behavior without source client content.

The active strict audit is 268/268 scoped authored design declarations, 88 referenced canonical tokens and zero gaps. Body/Notes roles, Control radius, button colors and shared theme surfaces remain connected. Named black/white paper overrides are local. Artwork pixels stay content-owned; native modality/focus/scroll restoration and source video/compositions remain supported. Likes are personal browser-local 0/1, with no aggregate count/account API.

Verification includes full source/fresh-starter checks (14 regression tests, content validation, strict audit, lint, TypeScript and build), EN/DE browser matrices and production smoke. Gallery QA walks the full published catalog in both directions, verifies project counters/links and cross-project slideshow, hidden details, bottom/corner layout, focus, retries, native video/compositions, live theme bindings and Studio mobile/picker behavior. Computer-use inspection confirms the new positions and Vana → Waveroom reverse wrap with matching project details. Local screenshots/results remain under `.qa/media/`; contact tests mock delivery and never send real mail.

Gallery controls now use local Iconoteka SVGs from MCP (MIT), with a common Notes-derived size instead of font-dependent glyphs. The uncircled information glyph is an explicit documented adaptation; the close glyph now has the same SVG size as every control. Icon hover and project button corners share one canonical Control radius rule. Browser QA probes 0/2/8px before and during hover on close, i, playback, paper and heart, including normal/hover project button colors. `siteConfig.name` is passed from the server so clean generation displays its own studio name.

The current action dock groups i and Like together at the right. View project is separated from that icon pair by the shared Medium gap (`--space-5`, 24px by default). The panel heading retains its existing vertical position.

## Versioned distribution

The native template now uses the hash-verified release/consumer transport already used for Granola, with provenance in `docs/template-release-provenance.json`. `template.release.json` enumerates project data/media ownership; schemas, routes, renderers, dependencies and operations remain managed. Authored site/SEO/locale values have separate data adapters, and shared content getters moved to `src/lib/content.ts`. The source appearance/content remains unchanged. Synthetic release tests cover integrity, data/deletion preservation, drift, API/route admission and atomic promotion; native source checks and production page/gallery QA validate the adapter. Source acceptance and consumer publication remain separate.
