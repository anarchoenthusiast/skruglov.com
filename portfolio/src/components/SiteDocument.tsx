import { StudioLauncher } from "@/components/template-studio/StudioLauncher";
import type { CSSProperties, ReactNode } from "react";
import { siteConfig } from "@/content/site";
import type { Locale } from "@/lib/localization";
import { getTheme, resolveThemeName } from "@/theme/presets";
export function SiteDocument({ children, locale }: { children: ReactNode; locale: Locale }) {
  const theme = resolveThemeName(process.env.SITE_THEME ?? siteConfig.appearance.theme);
  const tokens = { ...getTheme(theme), ...siteConfig.appearance.tokens };
  const postalAddress = Object.fromEntries(Object.entries(siteConfig.contact.postalAddress).filter(([, value]) => value));
  const schema = { "@context": "https://schema.org", "@type": "ProfessionalService", name: siteConfig.siteName, url: siteConfig.baseUrl, email: siteConfig.contact.email, ...(siteConfig.contact.telephone ? { telephone: siteConfig.contact.telephone } : {}), ...(Object.keys(postalAddress).length ? { address: { "@type": "PostalAddress", ...postalAddress } } : {}) };
  return <html lang={locale} data-theme={theme} style={tokens as CSSProperties}><body>
    <a className="skip-link" href="#main-content">{locale === "de" ? "Zum Inhalt" : "Skip to content"}</a>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\u003c") }} />
    {children}
    {process.env.NODE_ENV === "development" || process.env.ENABLE_TEMPLATE_STUDIO === "true" ? <StudioLauncher initialTokens={tokens} siteId={siteConfig.baseUrl} /> : null}
  </body></html>;
}
