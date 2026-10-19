import Link from "next/link";
import { siteConfig } from "@/content/site";
import { copy, localizePath, type Locale } from "@/content/locales";
import { SiteLogo } from "@/components/SiteLogo";

export function Footer({ locale = "en" }: { locale?: Locale }) {
  const { footer, contact } = siteConfig;
  const localizedCopy = copy[locale];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__row">
          <div className="site-footer__column">
            <Link href={localizePath(footer.logo.href, locale)} style={{ display: "block", maxWidth: siteConfig.brand.logo.width }}>
              <SiteLogo inverted />
            </Link>
          </div>
          <div className="site-footer__column site-footer__column--about">
            <p className="site-footer__about-title">{localizedCopy.footerTitle}</p>
            <p className="site-footer__about-body">{localizedCopy.footerBody}</p>
          </div>
        </div>

        <div className="site-footer__row">
          <div className="site-footer__column site-footer__column--disclaimer">
            <p className="site-footer__disclaimer">{footer.copyright}</p>
          </div>

          <div className="site-footer__column site-footer__column--about">
            <div className="site-footer__contacts">
              <p>
                {contact.companyName}
                <br />
                {contact.addressLines.map((line, index) => <span key={`${line}-${index}`}>{index > 0 ? <br /> : null}{line}</span>)}
              </p>
              {contact.contactLinks.map((item) => (
                <p key={item.href}>
                  {localizedCopy.inquiryLabel}
                  <br />
                  <a href={item.href}>{item.value}</a>
                </p>
              ))}
              {contact.socialLinks.map((item) => (
                <p key={item.href}>
                  {item.label}
                  <br />
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.value}
                  </a>
                </p>
              ))}
              <p>
                <Link href={localizePath("/impressum/", locale)}>{localizedCopy.legalLabel}</Link>
                <br />
                <Link href={localizePath("/datenschutz/", locale)}>{localizedCopy.privacyLabel}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
