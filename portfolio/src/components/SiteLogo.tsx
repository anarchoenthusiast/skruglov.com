import { siteConfig } from "@/content/site";
type SiteLogoProps = { inverted?: boolean; width?: number; height?: number; fluid?: boolean };
export function SiteLogo({ inverted = false, width = siteConfig.brand.logo.width, height = siteConfig.brand.logo.height, fluid = false }: SiteLogoProps) {
  const logo = siteConfig.brand.logo;
  return (
    // SVG/raster assets retain their authored colors; supply invertedSrc for a dark footer.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={inverted ? logo.invertedSrc : logo.src} alt={logo.alt} width={width} height={height}
      className={["brand-logo", fluid ? "brand-logo--fluid" : "", inverted ? "brand-logo--inverted" : ""].filter(Boolean).join(" ")} />
  );
}
