import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { officePageCopy } from "@/content/office-locales";
import { officePageContent } from "@/content/office";
import { localizePath, type Locale } from "@/content/locales";



export function OfficePage({ locale = "en" }: { locale?: Locale }) {
  const copy = officePageCopy[locale];

  return (
    <>
      <Header locale={locale} />
      <main id="main-content">
        <div className="page-title">
          <h1>{copy.hero}</h1>
        </div>

        <section className="page-shell studio-section studio-section--after-title text">
          <div className="text__inner text--1-column">
            <div className="text__item text-holder-large">
              <p>{copy.intro}</p>
            </div>
          </div>
        </section>

        <section className="page-shell studio-section text">
          <div className="text__inner text--3-column">
            <div className="text__item text-holder">
              <p>{copy.partners}</p>
              <p className="text-holder__lines">
                {officePageContent.partners.map((partner, index) => (
                  <span key={partner}>
                    {index > 0 ? <br /> : null}
                    {partner}
                  </span>
                ))}
              </p>
            </div>
            <div className="text__item text-holder">
              <p>{copy.inquiries}</p>
              {officePageContent.inquiries.map((item) => (
                <p key={item.href}>
                  {item.label}
                  <br />
                  <a href={item.href}>{item.value}</a>
                </p>
              ))}
            </div>
            <div className="text__item text-holder">
              <p>{copy.location}</p>
              <p className="text-holder__lines">
                {officePageContent.locationLines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </section>

        <section className="page-shell studio-section text">
          <div className="text__inner text--1-column">
            <div className="text__item text-holder">
              <p>{copy.about}</p>
            </div>
          </div>
        </section>

        <section className="page-shell studio-section text">
          <div className="text__inner text--1-column">
            <div className="text__item text-holder">
              <p>{copy.approach}</p>
              <p>
                <Link href={localizePath("/contact/", locale)}>{copy.contact}</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="page-shell studio-section text" aria-label={copy.services}>
          <div className="text__inner text--3-column office-grid">
            {copy.serviceItems.map((service) => (
              <div key={service.title} className="text__item text-holder">
                <p>{service.title}</p>
                <p>{service.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
