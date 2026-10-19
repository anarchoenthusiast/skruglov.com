# Customize or create a template

## Start a new site

```sh
npm run template:create -- ../new-studio --name "New Studio" --url https://example.com --email hello@example.com
cd ../new-studio
npm ci
npm run check
npm run dev
```

The destination must not exist. A clean starter includes one editable case study and neutral SVG media. It excludes source references, client projects/media, local secrets, Git history, build artifacts, source identity fonts and infrastructure scripts. The contact form starts disabled and search indexing starts disabled in `features.searchIndexing`. Copy `.env.example` to `.env.local` when configuring a preview.

## Brand and style

Edit `src/content/site-data.ts`: company name, navigation, URL, logo and inverted logo, contact details, footer, SEO assets, feature switches. Use consistent contact email and contactLinks. All public organization schema comes from this file.

Choose `appearance.theme`: `brightfutures`, `editorial`, or `midnight`. `SITE_THEME` can override it for a preview. Add typed token overrides under `appearance.tokens`; shared UI never needs per-page color/font edits. Desktop and mobile gutter, spacing, typography, radii and control colors are semantic tokens. For monochrome logos, the dark preset applies `--brand-image-filter: invert(1)` to the normal asset; set it to `none` when supplying a logo with its own dark-background treatment. Font files for the original identity stay with the original site; clean starters use system fonts for the original identity and include the shared Areal face for the Are.na typography preset.

## Content

- Home: `home.ts` (ordered responsive media sections).
- Projects: `projects.ts` (registry, slugs, publication status and covers).
- Case pages: `case-studies/` and its registry; `types.ts` documents all 12 blocks.
- Studio: `office.ts` and `office-locales.ts`.
- Contact labels and feedback: `contact.ts`.
- Footer/nav translation: `locales.ts`.
- Legal text: `legal.ts`; replace the generated placeholders with the operator's actual information.
- Page SEO: `page-seo.ts` and per-case SEO fields.
- Incomplete case fallback: `project-fallback.ts`.

Add local assets under `public/`. A published project without a registered case renders the canonical fallback. A project with `published: false` is excluded from public routes and indexes. Internal project `href` must agree with the slug. German case studies fall back to the English content when a translation is absent.

## Contact and publication

Enable `features.contactForm` only with actual mail configuration. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optionally `SMTP_FROM` and `CONTACT_TO` in the hosting secret store. Port 587 uses required STARTTLS; 465 uses implicit TLS. `MIGADU_SMTP_USER/PASS/FROM` remains compatible with the current deployment. Missing credentials return 503 and the form shows an error; it never reports a real message as sent.

Run `npm run check`. Run a production server on an unused port, then `PLAYWRIGHT_CHANNEL=chrome npm run qa:smoke -- http://localhost:3011`. Keep search blocking enabled during preview; enable `features.searchIndexing` and remove preview search blocking only when the content, services and operator information are ready.

The starter is a code template, with typed file-based authoring. It does not include a CMS or a visual administration interface.

## Live style settings and token QA

In development, click **Styles** at the bottom right, press **Shift+D**, or append `?studio=1` to any page. The editor uses the same DialKit panel as the other templates. Styles apply directly to the current page through the existing CSS tokens. Edits are local to this browser and persist across page reloads and language changes; they do not modify source files.

- **Typography / Colors / Spacing / Controls / Layout / Shape** edit canonical tokens with sliders. Adaptive sizes open a folder with Minimum px, Viewport vw and Maximum px; Fixed mode uses the Fixed px slider. This preserves the complete responsive formula without typing CSS. Every slider supports dragging, arrow keys and Enter for exact numeric input. Desktop and mobile typography remain independent.
- **Colors → Preset** includes Are.na Light, Dark, Dawn and Dusk from the neighboring Granola-derived studio. **Typography → Preset → Are.na · Areal** loads the real local face and source leading multipliers while retaining this template’s size hierarchy. Choosing a palette preserves typography and spacing; choosing typography preserves the palette. Manual changes show Custom, including after undo/reload. Source role mapping is recorded in `docs/arena-presets-source.json`.
- **Presets**, **Undo/Redo**, and **Reset to site defaults** allow comparison without losing the shipped baseline. Opening the editor does not change the design.
- **Theme → Export theme.json / Export theme.css** saves the current token values. Import accepts a compatible token object. Apply exported `tokens` to `siteConfig.appearance.tokens` to make changes permanent. The previous raw size fields and saved versions migrate to numeric folders with a local backup; numeric sliders retain their declared units; unregistered fonts need to be added to the site theme first.
- **Coverage → Report** shows a static source audit, per-token references and remaining hardcoded values with file/line locations. **Probe** temporarily changes one token, outlines responding rendered elements, then restores the exact previous value. **Highlight** outlines elements affected by normal edits. A zero response can mean a different breakpoint/page/state; it is not automatically a defect. Artwork is excluded from site-theme coverage.
- Close the floating panel or press **Shift+D** to reach page controls behind it. **Exit style mode** restores the server-supplied theme and removes the editor from the page.

`npm run audit:tokens` regenerates `src/theme/token-coverage.generated.json`; `npm run verify:tokens` checks that the report is current. Dev startup, build and the full check regenerate the report. The audit counts authored color, typography, spacing, border, focus, opacity and transition declarations in shared page CSS/React styles. It requires zero hardcoded design gaps and no unreferenced canonical tokens; build fails on a regression. Structural media geometry, screen-reader clipping and reduced-motion safety overrides remain fixed contracts, as do client artwork and image pixels. It does not claim full visual coverage from token-reference counts.

Run `PLAYWRIGHT_CHANNEL=chrome npm run qa:studio -- http://localhost:3012` against a dev server for live controls, history, presets, import/export, reload/language persistence, probes and mobile checks. `PLAYWRIGHT_CHANNEL=chrome npm run qa:themes -- http://localhost:3012` verifies all four Are.na palettes with Areal across pages, locales and screen sizes, including form states. Normal production builds omit the editor. Set `ENABLE_TEMPLATE_STUDIO=true` **at build time** only for an intentional QA preview.


### Semantic roles and local fonts

Typography is grouped by actual component roles: **Titles**, **Lead paragraphs**, **Body & interface**, **Notes & credits**, and **Navigation**. Each common group has **Show on page** to identify the affected elements. Titles use `--font-display`, introductions use `--font-lead`, and regular text/interface uses `--font-body`. Legal pages share the same roles. Captions use one size at every viewport and inherit the Body family. All header links, including the language switch, share the Navigation mobile size.

Choose **Custom font · Choose file…** from a Font selector or use **Typography → Upload font file…**. The font library accepts WOFF2, WOFF, TTF and OTF files, up to 10 MB. Assign a file to each role and specify its actual weight/style if needed. Files stay in this browser and reload before persisted controls. Theme JSON version 2 carries selected font files; Theme CSS includes self-contained font-face rules. Import/export can move the theme to another browser without an external font upload. Production still needs the exported CSS (or equivalent public font files and registrations) included in the project.

Old saved values, named versions and version 1 JSON themes migrate to the corrected font roles. The old panel data is backed up locally. See [the semantic style audit](../semantic-style-audit.md) for the consolidation map and verification scope.


### Desktop / Mobile preview

The global **Desktop / Mobile** ButtonGroup at the top selects both the visible controls and the actual responsive preview. It stays visible while scrolling. Each section shows one device's sizes/gutters/layout values plus shared styles; the other device's values remain saved, included in presets, history and exports. The initial mode follows the current window until explicitly selected; the selected mode survives reloads and route/locale changes in this tab.

When the selected device differs from the window, a same-origin preview renders the same route in a real 390px mobile viewport (or 1440px desktop viewport on a phone). Scaling the preview to fit does not change its CSS viewport. Fonts and theme values synchronize to it, internal links follow the host route, and highlighting/probes operate on the preview. The preview cannot open another editor. Exit style mode removes the preview and restores the normal page.

Typography exposes one **Size (px)** slider. Mobile sizes edit the mobile token. For adaptive sizes, the primary slider scales the range so the current preview responds immediately; **Responsive details** retains Adaptive/Fixed mode and the relevant range fields. Fonts and weights remain shared between devices. Changing a mobile size while viewing the desktop used to produce zero visible changes; the device switch now keeps the control and visible viewport aligned.

Run `npm run qa:devices -- http://localhost:3012` for responsive preview, size independence, history, font loading, reload, navigation, highlighting and probe checks.


### Global styles and selected layers

**All styles** shows the complete theme, grouped in native DialKit Folders. Top-level groups use the library's surface, border and text variables for a clearer hierarchy. Page links and forms work normally in this mode.

**Select layer** enables hover/click selection in the native page and responsive preview. Until a layer is selected, no token controls are shown. Selecting a supported element shows only its relevant settings, grouped by typography, colors and component/layout roles. There is no Related styles block or Show on page action in this mode. For example, a media frame exposes Frame corners without unrelated logo filters; captions inherit the Body font and leading without showing a Body size they do not use. The controls still edit shared template roles, not per-element overrides.

Static home assets, case images/video, composed slide outer frames and project cards all use `--media-radius`. Select the image/frame directly with one click; no double-click is required to reach it through Page. Brand marks retain their own filter settings. Internal artwork keeps its authored composition and item corners.

Desktop Body sizes now follow the same 768px breakpoint as the device switch, including header, reading text, footer, project index and form fields. Previous tablet-only rules at 768–1023px used the hidden mobile size even in Desktop mode. Mobile navigation keeps its own size.

While selecting, clicks select settings instead of following links or submitting forms. Press **Esc**, choose **All styles**, or collapse the panel to use ordinary interactions. Editor menus and file inputs remain excluded. Route/device changes clear the selected layer. In All styles, the original Show on page and coverage probes remain available.

Drag the panel header or its **⠿** grip to move it. The panel stays inside the viewport, remembers its position in this tab, and can be reset by double-clicking the grip. Focus the grip and use arrow keys to nudge it (Shift for a larger step), or Home to reset. Its own content scrolls when the available height is small.

Run `npm run qa:picker -- http://localhost:3012` for tablet Body consumers, static media corners, focused layer controls, mobile frames, dragging/persistence/reset, link/form interception and Escape/collapse restoration. Contact delivery is mocked and no real mail is sent.


### Media viewer and galleries

Only assets inside a published project detail page open the viewer. Home covers and Projects Image tiles keep project navigation. `ProjectPage` mounts the controller with a server-built catalog from `src/lib/media-catalog.ts`; other routes do not mount it. It supplies a typed `data-media-project` context for validating the clicked case media. Media annotations and the catalog share `blockGalleryMedia` descriptors, preserving case-block order and original image/video/composition semantics. Originals are loaded on demand rather than prefetched across projects.

The catalog contains only `getPublishedProjects()` entries, in content order. After a project’s last media, next/Play continues into the next published project; the final project wraps to the first. Previous/ArrowLeft wraps in reverse. The caption, project rows, Like identity and View project URL all follow the current slide. The counter stays local to its project (7/7 → 1/N). The underlying page URL/scroll remain unchanged while browsing, and closing restores the original clicked element. View project explicitly navigates to the currently viewed project. A single total slide disables arrows/Play; a project with one asset still links onward when other projects have media.

The inspector is **hidden by default** and toggled with an unringed **i** at bottom right immediately before Like. The studio name from `siteConfig.name` is top left and close is top right. Its heading is the asset’s authored `alt` caption (filename/composition fallback). Compact project rows use name/year from `ProjectSummary` and localized optional `role`/`skills` from `CaseStudyEntry` (skills fall back to tags). Unknown rows are omitted; no asset metadata/HEAD requests are displayed or fetched. The caption/credits area scrolls independently. View project appears in the bottom action row beside the heart when details are open; the narrow layout gives this aligned action pair a second row to avoid overlap.

Play/Pause, local counter and arrows sit at the **bottom center** of the modal. The binary paper switch stays at bottom left; personal heart/count stays at bottom right in both modes. View project shares the heart’s baseline when details are open. All controls remain visible on 320px screens. Collapsing/restoring releases media space without resetting the current slide, video, slideshow, paper or Like. Panel/paper state persists as the open viewer crosses projects; reopening starts with hidden details and the active site theme.

The initial surface uses Page background/text tokens. The paper icon toggles to the opposite light/dark paper; named overrides live in `src/theme/presets.ts` and never mutate site tokens. A single Control radius rule covers icon buttons and View project in normal/hover states, independently of Media frame radius; originals have no added corner clipping. Caption uses Body size/family; metadata/supporting controls use Notes with Body family. Normal/hover button colors, shared spacing, borders and focus remain themed.

The Showgrain-inspired stage/inspector uses native modality, inert background, Tab containment, Escape/backdrop closing, scroll lock and focus restore. No Showgrain workspace/account/editing services are imported. UI strings live in `src/content/media-viewer.ts` for EN/DE. Native video transport remains available; background case videos pause while the viewer is open. Explicit Play advances every five seconds across the same complete circle; Pause/manual navigation stops it, hidden tabs do not advance and closing clears the timer. Videos started by the slideshow are muted.

Likes remain site-scoped browser-local personal 0/1 state, not a public aggregate/account API. Storage failure leaves the gallery usable. Studio Select layer intercepts case media for styling; All styles permits viewing, including responsive previews. A clean starter includes the same catalog/controller with its own content and single-slide fallback.

Run `npm run qa:media -- http://localhost:3012` for case-only triggers and cover/tile links, hidden-by-default details, bottom-center/corner geometry, panel/Like continuity, complete published-project forward/reverse loop, per-project counters/links, cross-project slideshow, source image/video/compositions, native focus, retry, theme bindings and Studio preview. It covers EN/DE at 1440/390/320. Installed Chrome is used on macOS for H.264; elsewhere set `PLAYWRIGHT_CHANNEL=chrome` when needed. Reports/screenshots stay under `.qa/media/`.

Gallery icons come from the Iconoteka MCP library (MIT), rendered as local SVG paths rather than font glyphs. All share a 24-unit viewBox and an on-screen size of 1.25 × Notes size (20px at the default 16px Notes token). Close, arrows, play/pause, contrast and heart no longer vary with the selected font. The information icon is adapted from the library’s light glyph with its outer circle removed and optical scaling. Provenance: `docs/gallery-icon-source.json`. The active saved Control corners value can be 8px (for example Midnight); 0px makes both project button and icon hover surfaces square. Paper switching changes color only, never radius.

The current action dock groups i and Like together at the right. View project is separated from that icon pair by the shared Medium gap (`--space-5`, 24px by default). The panel heading retains its existing vertical position.
