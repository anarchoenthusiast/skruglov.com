import { getCaseStudyBySlug } from "@/lib/content";
import { getPublishedProjects } from "@/lib/content";
import type { Locale } from "@/content/locales";
import { localizePath } from "@/content/locales";
import type { FigmaSlideBlock, MediaAsset, ProjectPageBlock, SlideVideoBlock } from "@/content/types";

export interface ProjectGridTile {
  slug: string;
  href: string;
  alt: string;
  width: number;
  height: number;
  src?: string;
  figmaSlide?: Omit<FigmaSlideBlock, "kind" | "marginTop">;
  slideVideo?: Omit<SlideVideoBlock, "kind" | "marginTop">;
}

export function getProjectGridTileKey(tile: ProjectGridTile) {
  if (tile.figmaSlide) {
    return tile.figmaSlide.media.map((item) => item.src).join("::");
  }
  if (tile.slideVideo) {
    return tile.slideVideo.src;
  }
  return tile.src ?? `${tile.slug}-${tile.alt}`;
}

function imageSrcFromMedia(asset: MediaAsset) {
  if (asset.type === "video") {
    return asset.poster ?? null;
  }
  return asset.src;
}

function pushTile(
  tiles: ProjectGridTile[],
  seen: Set<string>,
  tile: ProjectGridTile | null,
) {
  if (!tile) return;
  const key = getProjectGridTileKey(tile);
  if (seen.has(key)) return;
  seen.add(key);
  tiles.push(tile);
}

function mediaAssetTile(asset: MediaAsset, slug: string, href: string): ProjectGridTile | null {
  const src = imageSrcFromMedia(asset);
  if (!src || !/\.(jpg|jpeg|png|webp)(\?|$)/i.test(src)) return null;

  return {
    slug,
    href,
    src,
    alt: asset.alt,
    width: asset.width,
    height: asset.height,
  };
}

function extractTilesFromBlocks(
  blocks: ProjectPageBlock[],
  slug: string,
  href: string,
): ProjectGridTile[] {
  const tiles: ProjectGridTile[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    switch (block.kind) {
      case "fullWidthImage":
        pushTile(tiles, seen, mediaAssetTile(block.image, slug, href));
        break;
      case "twoColMedia":
        for (const item of block.items) {
          pushTile(tiles, seen, mediaAssetTile(item.image, slug, href));
        }
        break;
      case "threeColMedia":
        for (const item of block.items) {
          pushTile(tiles, seen, mediaAssetTile(item.image, slug, href));
        }
        break;
      case "figmaSlide":
        pushTile(tiles, seen, {
          slug,
          href,
          alt: block.media[0]?.alt ?? "",
          width: block.slideWidth ?? 960,
          height: block.slideHeight ?? 640,
          figmaSlide: {
            background: block.background,
            radius: block.radius,
            slideWidth: block.slideWidth,
            slideHeight: block.slideHeight,
            media: block.media,
          },
        });
        break;
      case "slideVideo":
        pushTile(tiles, seen, {
          slug,
          href,
          alt: block.alt,
          width: 960,
          height: 640,
          slideVideo: {
            src: block.src,
            poster: block.poster,
            alt: block.alt,
            controls: block.controls,
            muted: block.muted,
            loop: block.loop,
          },
        });
        break;
      default:
        break;
    }
  }

  return tiles;
}

export function getProjectGridTiles(locale: Locale = "en"): ProjectGridTile[] {
  return getPublishedProjects().flatMap((project) => {
    const href = localizePath(project.href ?? `/projects/${project.slug}/`, locale);
    const study = getCaseStudyBySlug(project.slug, locale);

    if (!study) {
      return [
        {
          slug: project.slug,
          href,
          src: project.coverImage,
          alt: project.name,
          width: project.coverWidth,
          height: project.coverHeight,
        },
      ];
    }

    const tiles = extractTilesFromBlocks(study.blocks, project.slug, href);
    if (tiles.length > 0) return tiles;

    return [
      {
        slug: project.slug,
        href,
        src: project.coverImage,
        alt: project.name,
        width: project.coverWidth,
        height: project.coverHeight,
      },
    ];
  });
}
