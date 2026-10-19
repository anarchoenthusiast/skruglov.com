import {siteConfig} from "@/content/site";
import type {Locale} from "@/lib/localization";
export const navigation = {
  en: siteConfig.header.navItems,
  de: siteConfig.header.navItems.map((item) => ({ ...item, label: ({ "/projects/": "Projekte", "/contact/": "Kontakt" } as Record<string, string>)[item.href] ?? item.label })),
};

export const splashPhrases: Record<Locale, string[]> = {
  en: [...siteConfig.splash.phrases],
  de: [siteConfig.name],
};

export const copy = {
  en: {
    footerTitle: siteConfig.footer.aboutTitle,
    footerBody:
      siteConfig.footer.aboutBody,
    inquiryLabel: "New projects & general inquiries",
    legalLabel: "Impressum",
    privacyLabel: "Privacy",
    languageSwitchLabel: "DE",
  },
  de: {
    footerTitle: siteConfig.footer.aboutTitle,
    footerBody:
      siteConfig.footer.aboutBody,
    inquiryLabel: "Neue Projekte & allgemeine Anfragen",
    legalLabel: "Impressum",
    privacyLabel: "Datenschutz",
    languageSwitchLabel: "EN",
  },
} as const;
