import Image from "next/image";
import { assetMedia, blockGalleryMedia, mediaAttributes } from "@/lib/media-gallery";
import Link from "next/link";
import type {
  CaseStudyEntry,
  CreditsBlock,
  CtaLinkBlock,
  FigmaSlideBlock,
  FullWidthImageBlock,
  LargeIntroBlock,
  MediaAsset,
  ProjectHeroBlock,
  ProjectNoteBlock,
  ProjectPageBlock,
  RichParagraph,
  RichTextSegment,
  SlideVideoBlock,
  ThreeColMediaBlock,
  ThreeColTextBlock,
  TwoColMediaBlock,
  TwoColTextBlock,
} from "@/content/types";
import { ProjectFigmaSlide } from "@/components/project-blocks/ProjectFigmaSlide";
import { ProjectVideo } from "@/components/project-blocks/ProjectVideo";

const styles = {
  wrap: {
    marginRight: "auto",
    marginLeft: "auto",
    width: "calc(100% - var(--page-gutter) * 2)",
  } as const,

};

function renderSegments(segments: RichTextSegment[]) {
  return segments.map((segment, index) => {
    if (typeof segment === "string") {
      return <span key={index}>{segment}</span>;
    }

    if (segment.type === "link") {
      return (
        <Link
          key={index}
          href={segment.href}
          target={segment.external ? "_blank" : undefined}
          rel={segment.external ? "noopener noreferrer" : undefined}
          style={{ borderBottom: "var(--border-width) solid currentcolor" }}
        >
          {segment.text}
        </Link>
      );
    }

    if (segment.type === "em") {
      return <em key={index}>{segment.text}</em>;
    }

    return <strong key={index}>{segment.text}</strong>;
  });
}

function renderParagraphs(paragraphs: RichParagraph[], { intro = false }: { intro?: boolean } = {}) {
  return paragraphs.map((paragraph, index) => {
    const commonStyle = {
      fontStyle: paragraph.italic ? "italic" : "normal",
      marginBottom: index < paragraphs.length - 1 ? (intro ? "var(--paragraph-space-intro)" : "var(--paragraph-space-body)") : 0,
    };

    if (paragraph.variant === "blockquote") {
      return (
        <blockquote
          key={index}
          data-type-role={intro ? "lead" : paragraph.tone === "small" ? "caption" : "body"}
          style={{
            ...commonStyle,
            borderLeft: "none",
            paddingLeft: 0,
            marginLeft: 0,
            marginTop: 0,
            marginRight: 0,
          }}
        >
          {renderSegments(paragraph.segments)}
        </blockquote>
      );
    }

    return (
      <p key={index} data-type-role={intro ? "lead" : paragraph.tone === "small" ? "caption" : "body"} style={commonStyle}>
        {renderSegments(paragraph.segments)}
      </p>
    );
  });
}

function MediaAssetView({
  type = "image",
  src,
  alt,
  width,
  height,
  priority,
  poster,
}: MediaAsset) {
  const attributes=mediaAttributes(assetMedia({type,src,alt,width,height,poster}));
  if (type === "video") {
    return (
      <ProjectVideo
        className="template-media-frame"
        {...attributes}
        src={src}
        poster={poster}
        aria-label={alt}
        style={{ display: "block", width: "100%", height: "auto", objectFit: "cover" }}
      />
    );
  }

  return (
    <Image
      className="template-media-frame"
      {...attributes}
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={95}
      sizes="(max-width: 767px) 100vw, (max-width: 2559px) 100vw, 2560px"
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}

function Caption({ paragraphs }: { paragraphs: RichParagraph[] }) {
  return (
    <div style={{ marginTop: "var(--space-4)" }}>
      <div className="project-caption-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", columnGap: "var(--grid-gap)" }}>
        <div style={{ gridColumn: "span 4" }}>{renderParagraphs(paragraphs)}</div>
      </div>
    </div>
  );
}

function blockSpacing(value: number | undefined, fallback: string, baseline: number) { return `calc(${fallback} * ${(value ?? baseline) / baseline} * var(--project-block-space-scale))`; }

function renderHeroBlock(block: ProjectHeroBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--project-hero-space)", 43) }}>
      <h1 data-type-role="display">{block.title}</h1>
    </div>
  );
}

function renderLargeIntroBlock(block: LargeIntroBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-4)", 20) }}>
      {renderParagraphs(block.paragraphs, { intro: true })}
    </div>
  );
}

function renderFullWidthImageBlock(block: FullWidthImageBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-8)", 60) }}>
      <MediaAssetView {...block.image} />
    </div>
  );
}

function renderFigmaSlideBlock(block: FigmaSlideBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-8)", 60) }}>
      <div className="template-media-frame" {...mediaAttributes(blockGalleryMedia(block)[0])}><ProjectFigmaSlide
        background={block.background}
        radius={0}
        slideWidth={block.slideWidth}
        slideHeight={block.slideHeight}
        media={block.media}
      /></div>
    </div>
  );
}

function renderSlideVideoBlock(block: SlideVideoBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-8)", 60) }}>
      <div
        className="project-slide-wrap"
        {...mediaAttributes(blockGalleryMedia(block)[0])}
        style={{
          borderRadius: "var(--media-radius)",
          overflow: "hidden",
          aspectRatio: "960 / 640",
        }}
      >
        <ProjectVideo
          src={block.src}
          poster={block.poster}
          preload="metadata"
          controls={block.controls}
          muted={block.muted ?? true}
          loop={block.loop ?? true}
          aria-label={block.alt}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            maxWidth: "none",
            objectFit: "fill",
          }}
        />
      </div>
    </div>
  );
}

function renderProjectNoteBlock(block: ProjectNoteBlock) {
  return (
    <div
      className="project-wrap project-note"
      style={{
        ...styles.wrap,
        marginTop: blockSpacing(block.marginTop, "var(--space-3)", 12),
        width: "66.666667%",
        maxWidth: "100%",
        color: "var(--color-muted)",
      }}
    >
      {renderParagraphs(block.paragraphs.map((paragraph) => ({ ...paragraph, tone: "small" as const })))}
    </div>
  );
}

function renderTwoColMediaBlock(block: TwoColMediaBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-4)", 20) }}>
      <div className="project-media-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", columnGap: "var(--grid-gap)" }}>
        {block.items.map((item, index) => (
          <div key={index} style={{ gridColumn: `span ${item.span ?? 6}` }}>
            <MediaAssetView {...item.image} />
          </div>
        ))}
      </div>
      {block.caption ? <Caption paragraphs={block.caption} /> : null}
    </div>
  );
}

function renderThreeColMediaBlock(block: ThreeColMediaBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-8)", 60) }}>
      <div className="project-media-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", columnGap: "var(--grid-gap)" }}>
        {block.items.map((item, index) => (
          <div key={index} style={{ gridColumn: `span ${item.span ?? 4}` }}>
            <MediaAssetView {...item.image} />
          </div>
        ))}
      </div>
      {block.caption ? <Caption paragraphs={block.caption} /> : null}
    </div>
  );
}

function renderTwoColTextBlock(block: TwoColTextBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-8)", 60) }}>
      <div className="project-text-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", columnGap: "var(--grid-gap)" }}>
        {block.columns.map((column, index) => (
          <div key={index} style={{ gridColumn: `span ${column.span ?? 6}` }}>
            {renderParagraphs(column.paragraphs)}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderThreeColTextBlock(block: ThreeColTextBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-8)", 60) }}>
      <div className="project-text-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", columnGap: "var(--grid-gap)" }}>
        {block.columns.map((column, index) => (
          <div key={index} style={{ gridColumn: `span ${column.span ?? 4}` }}>
            {renderParagraphs(column.paragraphs)}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderCtaLinkBlock(block: CtaLinkBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--space-8)", 60) }}>
      <Link
        href={block.href}
        target={block.external ? "_blank" : undefined}
        rel={block.external ? "noopener noreferrer" : undefined}
        data-type-role="body" style={{ borderBottom: "var(--border-width) solid currentcolor" }}
      >
        {block.label}
      </Link>
    </div>
  );
}

function renderCreditsBlock(block: CreditsBlock) {
  return (
    <div className="project-wrap" style={{ ...styles.wrap, marginTop: blockSpacing(block.marginTop, "var(--section-space)", 120) }}>
      <div className="project-credits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", columnGap: "var(--grid-gap)" }}>
        <div style={{ gridColumn: "2 / span 10" }}>
          <p data-type-role="caption" style={{ marginBottom: "var(--paragraph-space-body)" }}>
            <strong>{block.heading}</strong>
          </p>
          <p data-type-role="caption">
            {block.lines.map((line, index) => (
              <span key={line}>
                {line}
                {index < block.lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}

function renderBlock(block: ProjectPageBlock, index: number) {
  switch (block.kind) {
    case "projectHero":
      return <div key={index}>{renderHeroBlock(block)}</div>;
    case "largeIntro":
      return <div key={index}>{renderLargeIntroBlock(block)}</div>;
    case "fullWidthImage":
      return <div key={index}>{renderFullWidthImageBlock(block)}</div>;
    case "figmaSlide":
      return <div key={index}>{renderFigmaSlideBlock(block)}</div>;
    case "slideVideo":
      return <div key={index}>{renderSlideVideoBlock(block)}</div>;
    case "projectNote":
      return <div key={index}>{renderProjectNoteBlock(block)}</div>;
    case "twoColMedia":
      return <div key={index}>{renderTwoColMediaBlock(block)}</div>;
    case "threeColMedia":
      return <div key={index}>{renderThreeColMediaBlock(block)}</div>;
    case "twoColText":
      return <div key={index}>{renderTwoColTextBlock(block)}</div>;
    case "threeColText":
      return <div key={index}>{renderThreeColTextBlock(block)}</div>;
    case "ctaLink":
      return <div key={index}>{renderCtaLinkBlock(block)}</div>;
    case "credits":
      return <div key={index}>{renderCreditsBlock(block)}</div>;
    default: {
      const unsupported: never = block;
      throw new Error(`Unsupported project block: ${JSON.stringify(unsupported)}`);
    }
  }
}

export function ProjectPageRenderer({ entry }: { entry: CaseStudyEntry }) {
  return (
    <>
      {entry.blocks.map(renderBlock)}
      <style>{`
        @media (max-width: 767px) {
          .project-wrap {
            width: calc(100% - var(--page-gutter) * 2) !important;
          }
          .project-media-grid,
          .project-text-grid,
          .project-caption-grid,
          .project-credits-grid {
            grid-template-columns: repeat(6, 1fr) !important;
            column-gap: var(--grid-gap-mobile) !important;
          }
          .project-media-grid > div,
          .project-text-grid > div,
          .project-caption-grid > div,
          .project-credits-grid > div {
            grid-column: span 6 !important;
          }
          .project-note {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
