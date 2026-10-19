"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy, getNavigation, localizePath, type Locale } from "@/content/locales";

export function Header({ locale = "en" }: { locale?: Locale }) {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const navigation = getNavigation(locale);
  const alternateLocale = locale === "en" ? "de" : "en";

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;
    const OFFSET = 40;
    const TOLERANCE_UP = 10;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = currentY - lastScrollY;

          if (currentY > OFFSET) {
            if (diff > 0) {
              header.style.transform = "translateY(-100%)";
            } else if (diff < -TOLERANCE_UP) {
              header.style.transform = "translateY(0)";
            }
          } else {
            header.style.transform = "translateY(0)";
          }

          lastScrollY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <nav aria-label={locale === "de" ? "Hauptnavigation" : "Main navigation"}><ul className="site-header__nav">
        {navigation.map((item) => (
          <li key={item.href} className="site-header__item">
            <Link href={item.href} className="site-header__link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul></nav>

      <div className="site-header__meta site-header__meta--lang">
        <Link
          href={localizePath(pathname, alternateLocale)}
          hrefLang={alternateLocale}
          lang={alternateLocale}
          aria-label={`Switch language to ${copy[locale].languageSwitchLabel}`}
          className="site-header__link"
        >
          {copy[locale].languageSwitchLabel}
        </Link>
      </div>
    </header>
  );
}
