"use client";
import { useEffect, useState } from "react";
import { splashPhrases, type Locale } from "@/content/locales";
export function SplashScreen({ locale = "en" }: { locale?: Locale }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => setVisible(false), 3600);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, []);
  if (!visible) return null;
  return <button type="button" className="site-splash" onClick={() => setVisible(false)} aria-label={locale === "de" ? "Intro überspringen" : "Skip introduction"}>
    <span>{splashPhrases[locale].join(" ")}</span>
  </button>;
}
