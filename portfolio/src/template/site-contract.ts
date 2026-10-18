import type { ThemeName, ThemeTokens } from "@/theme/presets";
import type { ContactLink, NavItem, SocialLink } from "@/content/types";
export interface SiteDefinition {
  name: string; siteName: string; shortName: string; baseUrl: string; language: string;
  defaultTitle: string; defaultDescription: string; titleSuffix: string; copyrightRangeLabel: string;
  appearance: { theme: ThemeName; tokens: Partial<ThemeTokens> };
  features: { splash: boolean; contactForm: boolean; searchIndexing: boolean };
  header: { navItems: readonly NavItem[] };
  splash: { phrases: readonly string[] };
  brand: { logo: { src: string; invertedSrc: string; alt: string; width: number; height: number } };
  footer: { logo: { href: string }; aboutTitle: string; aboutBody: string; copyright: string };
  contact: { email: string; telephone: string; companyName: string; addressLines: readonly string[]; officeAddressLines: readonly string[]; contactLinks: readonly ContactLink[]; socialLinks: readonly SocialLink[]; postalAddress: { streetAddress: string; postalCode: string; addressLocality: string; addressCountry: string } };
  seo: { locale: string; openGraphImage: { url: string; width: number; height: number }; icons: { icon: readonly { url: string; sizes: string }[]; apple: string } };
}
