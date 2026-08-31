import type { ImageMetadata } from "astro";

const coverModules = import.meta.glob<{ default: ImageMetadata }>(
  "../../public/projects/*/cover.{png,jpg,jpeg,webp}",
  { eager: true },
);

const coversBySlug = new Map<string, ImageMetadata>();

for (const [path, mod] of Object.entries(coverModules)) {
  const match = path.match(/\/projects\/([^/]+)\/cover\.\w+$/);
  if (match) {
    coversBySlug.set(match[1], mod.default);
  }
}

export function getProjectCover(slug: string): ImageMetadata | undefined {
  return coversBySlug.get(slug);
}
