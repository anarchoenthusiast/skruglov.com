import { SplashScreen } from "@/components/SplashScreen";
import { Header } from "@/components/Header";
import { MediaGrid } from "@/components/MediaGrid";
import { Footer } from "@/components/Footer";
import { getHomePageSections } from "@/lib/content";
import { siteConfig } from "@/content/site";
import type { Locale } from "@/content/locales";

export function HomePage({ locale = "en" }: { locale?: Locale }) {
  const sections = getHomePageSections(locale);

  return (
    <>
      {siteConfig.features.splash ? <SplashScreen locale={locale} /> : null}
      <Header locale={locale} />

      <main id="main-content"><h1 className="visually-hidden">{siteConfig.defaultTitle}</h1>
        {sections.map((section, index) => (
          <MediaGrid
            key={`${section.layout}-${index}`}
            layout={section.layout}
            whitespace={section.whitespace}
            isFirst={section.isFirst}
            items={section.items}
          />
        ))}
      </main>

      <Footer locale={locale} />
    </>
  );
}
