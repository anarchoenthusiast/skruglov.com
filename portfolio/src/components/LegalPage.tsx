import { legalPageContent } from "@/content/legal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { Locale } from "@/content/locales";


function renderLegalParagraphs(paragraphs: string[], sectionTitle: string) {
  return paragraphs.map((paragraph, index) => (
    <p key={`${sectionTitle}-${index}`}>
      {paragraph.split("\n").map((line, lineIndex, lines) => {
        const phoneMatch = line.match(/^(Phone|Telefon): (.+)$/);
        const emailMatch = line.match(/^(Email|E-Mail): (.+)$/);

        if (phoneMatch) {
          const [, label, value] = phoneMatch;
          return (
            <span key={`${line}-${lineIndex}`}>
              {label}: <a href={`tel:${value.replace(/[^+\d]/g, "")}`}>{value}</a>
              {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
          );
        }

        if (emailMatch) {
          const [, label, value] = emailMatch;
          return (
            <span key={`${line}-${lineIndex}`}>
              {label}: <a href={`mailto:${value}`}>{value}</a>
              {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
          );
        }

        return (
          <span key={`${line}-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </span>
        );
      })}
    </p>
  ));
}

export function ImpressumPage({ locale = "de" }: { locale?: Locale }) {
  const copy = legalPageContent[locale];
  return (
    <>
      <Header locale={locale} />
      <main id="main-content" className="legal-shell">
        <h1>{copy.imprint}</h1>
        {copy.imprintSections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {renderLegalParagraphs(section.paragraphs, section.title)}
          </section>
        ))}
      </main>
      <Footer locale={locale} />
    </>
  );
}

export function PrivacyPage({ locale = "de" }: { locale?: Locale }) {
  const copy = legalPageContent[locale];

  return (
    <>
      <Header locale={locale} />
      <main id="main-content" className="legal-shell">
        <h1>{copy.privacy}</h1>
        {copy.privacySections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {renderLegalParagraphs(section.paragraphs, section.title)}
          </section>
        ))}
      </main>
      <Footer locale={locale} />
    </>
  );
}
