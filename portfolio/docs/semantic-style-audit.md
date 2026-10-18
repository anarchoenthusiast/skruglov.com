# Semantic style audit

The existing site was inspected in the in-app browser on the Vana case, office, contact and legal pages, including text-role highlighting. Browser regression checks additionally compare computed styles at desktop and phone widths. This is a source-template refactor, not a screenshot reconstruction.

| Before | Shared role and scope |
| --- | --- |
| Body font also changed every page and case title | `--font-display`: Titles — page headings and projects-view labels |
| Display font only changed large introductory paragraphs | `--font-lead`: Lead paragraphs — office/contact/case introductions |
| Other reading/interface text inherited the body face implicitly | `--font-body`: Body & interface — reading copy, navigation, footer, forms; captions inherit the family |
| Legal copy, titles, tracking and leading had separate near-duplicate settings | Legal pages reuse Titles and Body; subsection labels use emphasis weight |
| Small text jumped from 16 to 20 px on phones | One Notes & credits size at every width; supporting form copy and footer copyright share it |
| Language switch had its own mobile type size | One Navigation mobile size, shared by all header links |
| Body/display/title normal weight controls all started at 400 | One normal weight and one emphasis weight |
| Case block margins in content bypassed spacing tokens | Content values now express a ratio of the canonical block spacing; shared spacing and case scale both work |
| Credit blocks and fallback pages had another 120 px spacing constant | Shared responsive section rhythm |
| Labels came from mechanically title-cased CSS variable names | Explicit component folders, units, and Show on page actions for common visible roles |

The contract changes from 99 to 88 canonical tokens. Fixed type sizes now have three principal roles plus a caption size; desktop/mobile sizes remain where the hierarchy needs them. Adaptive desktop sizes keep minimum/viewport/maximum controls, with a Fixed mode. Existing site font choices are preserved: NeueMontreal for titles/body, TimesNow for introductions. Default body leading is 1.3. Near-duplicate raw spacing values are retained only where they serve distinct component contracts.

## Local fonts

Each Font selector includes **Custom font · Choose file…**. Typography also exposes **Upload font file…** and **Font library**. The library accepts WOFF2/WOFF/TTF/OTF up to 10 MB, loads the actual file with FontFace, and assigns it independently to Titles, Lead paragraphs, or Body & interface. The file's weight/style can be specified, including a variable 100–900 range when the file supports it. The control does not pretend to infer a font's metadata.

Files stay in IndexedDB on this browser/origin. A generated safe family name is derived from file bytes. Reloading or switching language restores the font library before saved controls hydrate. Invalid files are rejected before assignment. There is no upload to a server and no scan of installed machine fonts.

Theme JSON version 2 embeds only referenced custom font files. Import validates the bundle and restores it in a fresh browser profile. Theme CSS is self-contained with data-URL `@font-face` declarations, followed by canonical tokens. To ship the result, save exported CSS in the project and import it after the base styles (or move the files into `public/fonts/` and register equivalent font faces). A typed token override alone does not contain font file bytes.

Version 1 theme imports map the former Display font to Lead paragraphs and the former Body font to both Titles and Body, preserving the prior visual choices. Stored panel values and named versions migrate to component folders, retaining a backup at the localStorage key suffix `:before-semantic-roles`. Consolidated legal/caption/mobile roles follow the common scale.

## Verification

`npm run check` covers the strict source-token audit, content, regression tests, lint, types and production build. `qa:studio` checks role isolation, real custom-font loading, history, presets, portable exports/import into a fresh browser profile, persistence, explicit block margin binding, shared legal typography, caption/navigation roles on phones, highlighting and probes. `qa:themes` covers palette/locale/viewport combinations. `qa:smoke` runs against production. Reports/screenshots are local under `.qa/`.

Final local results (2026-10-18): source and a freshly generated Northstar starter each pass all 13 tests, strict 217/217 declaration auditing, lint, TypeScript and production build. Both pass the live editor browser scenario, including legacy saved-version migration and real JSON/CSS font loading in fresh profiles. Source Are.na theme QA passes 144 cases. Production smoke passes 36 cases per project. No real test mail was sent. The existing GitHub Actions account-billing limitation is separate from these local results.
