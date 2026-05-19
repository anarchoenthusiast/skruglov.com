# skruglov.com

Public source for the personal portfolio and blog of **Sergey Kruglov** — product designer and engineer.

**Live site:** [skruglov.com](https://skruglov.com)

## About

This repository powers a static portfolio site with project case studies, writing, and an about page. Content lives in MDX; the UI is built with Astro components, Tailwind CSS, and a small design-token layer synced from Figma.

The site started from the [Astro Nano](https://github.com/markhorn-dev/astro-nano) template and has been heavily customized since.

## Stack

- [Astro](https://astro.build/) 5 — static site generator
- [MDX](https://mdxjs.com/) — blog posts and project pages
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Sharp](https://sharp.pixelplumbing.com/) — image optimization at build time
- Deployed on [Netlify](https://www.netlify.com/)

## Project structure

```
src/
  components/     # Astro UI components
  content/        # MDX: projects, blog, about, colophon
  layouts/        # Page layouts
  pages/          # Routes (home, blog, projects, RSS, …)
  styles/         # Global CSS and design tokens
public/           # Static assets (covers, blog images, fonts, CV)
scripts/          # Token sync and secrets helper
```

## Getting started

**Requirements:** Node.js 20+ (see `.nvmrc`) or [Bun](https://bun.sh/).

```bash
git clone https://github.com/anarchoenthusiast/skruglov.com.git
cd skruglov.com

bun install          # or: npm install
bun run dev          # http://localhost:4321
```

No `.env` file is required for local development or a standard build. Optional environment variables are only needed for Figma token sync (see below).

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server with hot reload |
| `bun run dev:network` | Dev server exposed on LAN |
| `bun run build` | Typecheck + production build → `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run build:netlify` | Netlify CI build (npm + sharp) |
| `bun run lint` | ESLint |
| `bun run tokens:sync` | Pull design tokens from Figma (needs `FIGMA_TOKEN`) |

## Environment & secrets

Secrets are **not** committed to this repository. `.env` and `.env.*` are gitignored.

For maintainers who use [1Password CLI](https://developer.1password.com/docs/cli/), `./scripts/secrets-manager.sh` can back up or restore local env files. See [SETUP_RECOVERY.md](./SETUP_RECOVERY.md) for deployment and recovery.

To sync tokens from Figma:

```bash
FIGMA_TOKEN=your_token bun run tokens:sync
```

## Deployment

Production builds run on Netlify (`netlify.toml`):

```bash
npm run build:netlify
```

Output is published from `dist/`.

## Content

| Path | Purpose |
|------|---------|
| `src/content/projects/` | Project case studies |
| `src/content/blog/` | Blog posts |
| `src/content/about/` | About page copy |
| `src/assets/projects/` | Project gallery images (optimized by Astro) |
| `public/` | Static files referenced by URL |

Draft entries use `draft: true` in frontmatter and are excluded from production.

## Contributing

This is a personal site, but suggestions and bug reports are welcome via [GitHub Issues](https://github.com/anarchoenthusiast/skruglov.com/issues).

## Credits

- **Site design & development:** [Sergei Kruglov](https://skruglov.com)
- **Initial template:** [Astro Nano](https://github.com/markhorn-dev/astro-nano) by Mark Horn

Third-party assets (fonts, images, client work, and project materials) remain the property of their respective owners.

## License

You may view, fork, and reuse this source code for **personal, educational, or other non-commercial** purposes, with attribution to Sergei Kruglov and a link to this repository.

**Commercial use is not permitted** without prior written permission.

When reusing code or design patterns from this project, please credit Sergei Kruglov. Respect third-party rights: do not redistribute fonts, images, or case-study content outside the terms of their original licenses.

## Links

- Website: [skruglov.com](https://skruglov.com)
- Colophon: [skruglov.com/colophon](https://skruglov.com/colophon)
- LinkedIn: [kruglovse](https://www.linkedin.com/in/kruglovse/)
