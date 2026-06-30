# AGENTS.md

Instructions for AI agents working in this repository.

## Cursor Cloud specific instructions

### Overview

Static Astro portfolio site (skruglov.com). No `.env` file is required for local development or production builds.

### Environment setup

Dependencies are installed automatically via `.cursor/environment.json` (`npm install`). The dev server starts on port **4321**.

### Common commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run tokens:sync` | Pull design tokens from Figma (requires `FIGMA_TOKEN`) |

### Notes

- **Runtime:** Node.js 20+ (see `.nvmrc`). Cloud uses npm; Bun is optional locally (`bun.lock` is present).
- **Secrets:** `./scripts/secrets-manager.sh` (1Password CLI) is not available in cloud. Standard dev/build does not need secrets.
- **Optional env vars:** `FIGMA_TOKEN` — only for `npm run tokens:sync`.
- **Content:** MDX in `src/content/` (projects, blog, about). UI components in `src/components/`.
- **Deploy:** Netlify via `npm run build:netlify` (see `netlify.toml`).

### Verification

After changes, run `npm run build` to typecheck and verify the static site builds. Use `npm run lint` for code style checks.
