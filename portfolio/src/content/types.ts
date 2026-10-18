export type MediaLayout = "1-column" | "2-column" | "3-column";
export type WhitespaceSize = "s" | "m" | "l";
export type ItemSize = "xl" | "l" | "m" | "s" | "";

export interface MediaItem {
  type: "image" | "video" | "logo";
  src: string;
  poster?: string;
  alt?: string;
  href?: string;
  size: ItemSize;
  width?: number;
  height?: number;
  coverStyle?: "default" | "substrate";
  substrateBg?: string;
}

export interface HomeSection {
  layout: MediaLayout;
  whitespace: WhitespaceSize;
  items: MediaItem[];
  isFirst?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface ContactLink {
  label: string;
  value: string;
  href: string;
}

export interface SocialLink {
  label: string;
  value: string;
  href: string;
}

export interface ProjectSummary {
  slug: string;
  client: string;
  name: string;
  category?: string;
  year?: number;
  tags?: string[];
  coverImage: string;
  coverWidth: number;
  coverHeight: number;
  href?: string;
  published?: boolean;
  featured?: boolean;
}

export type RichTextSegment =
  | string
  | {
      type: "link";
      text: string;
      href: string;
      external?: boolean;
    }
  | {
      type: "em";
      text: string;
    }
  | {
      type: "strong";
      text: string;
    };

export interface RichParagraph {
  segments: RichTextSegment[];
  tone?: "body" | "small";
  italic?: boolean;
  variant?: "paragraph" | "blockquote";
}

export interface TextColumn {
  span?: 4 | 6 | 8;
  paragraphs: RichParagraph[];
}

export interface MediaAsset {
  type?: "image" | "video";
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  poster?: string;
}

export interface MediaColumnItem {
  span?: 4 | 6 | 8;
  image: MediaAsset;
}

export interface ProjectHeroBlock {
  kind: "projectHero";
  title: string;
  marginTop?: number;
}

export interface LargeIntroBlock {
  kind: "largeIntro";
  paragraphs: RichParagraph[];
  marginTop?: number;
}

export interface FullWidthImageBlock {
  kind: "fullWidthImage";
  image: MediaAsset;
  marginTop?: number;
}

export interface TwoColMediaBlock {
  kind: "twoColMedia";
  items: [MediaColumnItem, MediaColumnItem];
  caption?: RichParagraph[];
  marginTop?: number;
}

export interface ThreeColMediaBlock {
  kind: "threeColMedia";
  items: [MediaColumnItem, MediaColumnItem] | [MediaColumnItem, MediaColumnItem, MediaColumnItem];
  caption?: RichParagraph[];
  marginTop?: number;
}

export interface TwoColTextBlock {
  kind: "twoColText";
  columns: [TextColumn, TextColumn];
  marginTop?: number;
}

export interface ThreeColTextBlock {
  kind: "threeColText";
  columns: [TextColumn, TextColumn] | [TextColumn, TextColumn, TextColumn];
  marginTop?: number;
}

export interface CtaLinkBlock {
  kind: "ctaLink";
  label: string;
  href: string;
  external?: boolean;
  marginTop?: number;
}

export interface CreditsBlock {
  kind: "credits";
  heading: string;
  lines: string[];
  marginTop?: number;
}

export interface FigmaSlideMediaItem {
  kind: "video" | "image";
  src: string;
  poster?: string;
  alt: string;
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  fit?: "contain" | "cover" | "fill";
  clipBackground?: string;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export interface FigmaSlideBlock {
  kind: "figmaSlide";
  background?: string;
  radius?: number;
  slideWidth?: number;
  slideHeight?: number;
  media: FigmaSlideMediaItem[];
  marginTop?: number;
}

export interface SlideVideoBlock {
  kind: "slideVideo";
  src: string;
  poster?: string;
  alt: string;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  marginTop?: number;
}

export interface ProjectNoteBlock {
  kind: "projectNote";
  paragraphs: RichParagraph[];
  marginTop?: number;
}

export type ProjectPageBlock =
  | ProjectHeroBlock
  | LargeIntroBlock
  | FullWidthImageBlock
  | FigmaSlideBlock
  | SlideVideoBlock
  | ProjectNoteBlock
  | TwoColMediaBlock
  | ThreeColMediaBlock
  | TwoColTextBlock
  | ThreeColTextBlock
  | CtaLinkBlock
  | CreditsBlock;

export interface CaseStudyEntry {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  /** Structured project credits, shared by the media inspector. */
  role?: string;
  skills?: string[];
  blocks: ProjectPageBlock[];
}
