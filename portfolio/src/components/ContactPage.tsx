import { contactPageContent } from "@/content/contact";
import { siteConfig } from "@/content/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { localizePath, type Locale } from "@/content/locales";
import Link from "next/link";


export function ContactPage({ locale = "en" }: { locale?: Locale }) {
  const copy = contactPageContent[locale];

  return (
    <>
      <Header locale={locale} />
      <main id="main-content">
        <div className="page-title">
          <h1>{copy.title}</h1>
        </div>

        <section className="page-shell studio-section studio-section--after-title text">
          <div className="text__inner text--1-column">
            <div className="text__item text-holder-large">
              <p>{copy.body}</p>
            </div>
          </div>
        </section>

        <section className="page-shell studio-section text">
          {siteConfig.features.contactForm ? <ContactForm locale={locale} /> : null}
          <p className="text-holder-small contact-privacy">
            {copy.privacyNote}{" "}
            <Link href={localizePath("/datenschutz/", locale)}>{copy.privacyLink}</Link>.
          </p>
          <p className="text-holder-small contact-direct">
            {copy.direct}{" "}
            <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.
          </p>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
