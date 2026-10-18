import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProjectVideo } from "@/components/project-blocks/ProjectVideo";
import { SiteLogo } from "@/components/SiteLogo";
import type { MediaItem, MediaLayout, WhitespaceSize } from "@/content/types";
type ItemSize = MediaItem["size"];

interface MediaGridProps {
  layout: MediaLayout;
  whitespace: WhitespaceSize;
  items: MediaItem[];
  isFirst?: boolean;
}

function getGridColumn(layout: MediaLayout, size: ItemSize): string {
  if (layout === "3-column") {
    if (size === "l") return "span 8";
    if (size === "s") return "span 4";
    return "span 12";
  }
  if (layout === "2-column") {
    return "span 6";
  }
  if (size === "xl") return "span 12";
  if (size === "l") return "3 / span 8";
  if (size === "m") return "4 / span 6";
  if (size === "s") return "5 / span 4";
  return "span 12";
}

function getCoverClass(item: MediaItem) {
  if (item.coverStyle === "substrate") return "media-cover media-cover--substrate";
  return "media-cover";
}

export function MediaGrid({ layout, whitespace, items, isFirst }: MediaGridProps) {
  const outerClass = [
    "media-grid-outer",
    isFirst ? "media-grid-outer--first" : `media-grid-outer--whitespace-${whitespace}`,
  ].join(" ");

  return (
    <div className={outerClass}>
      <div className="media-inner">
        {items.map((item, i) => {
          const col = getGridColumn(layout, item.size);
          const isLogo = item.type === "logo";
          const coverClass = isLogo ? undefined : getCoverClass(item);

          const substrateStyle =
            item.coverStyle === "substrate"
              ? ({ ["--substrate-bg" as string]: item.substrateBg ?? "var(--color-substrate)" } as CSSProperties)
              : undefined;

          const inner = coverClass ? (
            <div className={coverClass} style={substrateStyle}>
              {item.type === "video" ? (
                <ProjectVideo
                  src={item.src}
                  poster={item.poster}
                  preload="metadata"
                  aria-label={item.alt || ""}
                />
              ) : (
                <Image
                  src={item.src}
                  alt={item.alt || ""}
                  width={item.width || 1000}
                  height={item.height || 667}
                  quality={95}
                  sizes={layout === "1-column" ? "100vw" : "(max-width: 767px) 100vw, 50vw"}
                  priority={isFirst && i === 0}
                />
              )}
            </div>
          ) : item.type === "video" ? (
            <ProjectVideo
              src={item.src}
              poster={item.poster}
              preload="metadata"
              aria-label={item.alt || ""}
            />
          ) : isLogo ? (
            <SiteLogo fluid />
          ) : (
            <Image
              src={item.src}
              alt={item.alt || ""}
              width={item.width || 1000}
              height={item.height || 667}
              quality={95}
              sizes={layout === "1-column" ? "100vw" : "(max-width: 767px) 100vw, 50vw"}
              priority={isFirst && i === 0}
            />
          );

          return (
            <div
              key={i}
              style={{ gridColumn: col }}
              className={isLogo ? "media-item media-item--logo" : "media-item"}
            >
              {item.href ? (
                <Link href={item.href} className="media-item__link">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
