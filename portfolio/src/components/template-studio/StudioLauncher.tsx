"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ThemeTokens } from "@/theme/presets";
import { migrateStoredStudio } from "./persistence";
import styles from "./studio.module.css";
import { PREVIEW_QUERY, PreviewBridge } from "./DevicePreview";
const TemplateStudio = dynamic(() => import("./TemplateStudio"), { ssr: false });
export function StudioLauncher({ initialTokens, siteId }: { initialTokens: ThemeTokens; siteId: string }) {
  const [active, setActive] = useState(false);
  const [preview,setPreview]=useState(false);
  const storageKey = `template-studio-enabled:${siteId}`;
  useEffect(() => {
    if(new URLSearchParams(location.search).get(PREVIEW_QUERY)==="1") {const frame=requestAnimationFrame(()=>setPreview(true));return()=>cancelAnimationFrame(frame);}
    migrateStoredStudio(`template-studio-values:${siteId}`, initialTokens);
    let restore = new URLSearchParams(location.search).get("studio") === "1";
    try { restore ||= sessionStorage.getItem(storageKey) === "1"; } catch { /* Session-only UI still works. */ }
    const frame = requestAnimationFrame(() => { if (restore) setActive(true); });
    function shortcut(event: KeyboardEvent) {
      if (!active && event.shiftKey && event.code === "KeyD" && !event.ctrlKey && !event.metaKey && !event.altKey && !(event.target as HTMLElement).closest("input, textarea, select, [contenteditable=true]")) { event.preventDefault(); setActive(true); }
    }
    window.addEventListener("keydown", shortcut);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", shortcut); };
  }, [storageKey, active, initialTokens, siteId]);
  useEffect(() => { try { if (active) sessionStorage.setItem(storageKey, "1"); } catch { /* Persistence is optional. */ } }, [active, storageKey]);
  if(preview)return <PreviewBridge initialTokens={initialTokens}/>;
  if (active) return <TemplateStudio initialTokens={initialTokens} siteId={siteId} onExit={() => {
    try { sessionStorage.removeItem(storageKey); } catch { /* Session-only UI still works. */ }
    const url = new URL(location.href); url.searchParams.delete("studio"); history.replaceState(null, "", url);
    setActive(false);
  }} />;
  return <button data-template-studio-ui className={styles.launcher} onClick={() => setActive(true)} title="Style settings · Shift+D">Styles <span>⇧D</span></button>;
}
