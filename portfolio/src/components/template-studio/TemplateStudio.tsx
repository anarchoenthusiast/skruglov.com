"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useDialKitController, type DialConfig } from "dialkit";
import "dialkit/styles.css";
import { themes, type ThemeTokens } from "@/theme/presets";
import { applyStylePreset, colorPresets, typographyPresets, selectedStylePreset } from "@/theme/style-presets";
import sourceReport from "@/theme/token-coverage.generated.json";
import { clearHighlights, capturePaint, finishProbe, tokenProbeValue, inspectElements } from "./probe";
import { controlPath, fluidFields, normalizedTheme, fontOptions, tokenProperty, themeCss, tokenControls, tokensFromValues, validateTokens, valuesFromTokens, type CoverageReport, type TokenKey } from "./schema";
import { StudioHistory } from "./history";
import styles from "./studio.module.css";
import { StudioPanel } from "./StudioPanel";
import { DevicePreview, THEME_EVENT } from "./DevicePreview";
import type { StudioDevice } from "./device-model";
import { inspectedSections, readPath, writePath, type EditorTree } from "./control-model";
import { savedLocalFonts, registerLocalFont, makeLocalFont, saveLocalFonts, packFonts, unpackFonts, fontCss, fontStack, type LocalFont } from "./local-fonts";

function download(name: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type StudioProps = { initialTokens: ThemeTokens; siteId: string; onExit: () => void };
export default function TemplateStudio(props: StudioProps) {
  const [loaded, setLoaded] = useState<{fonts: LocalFont[]; error: string} | null>(null);
  useEffect(() => {
    let active = true;
    savedLocalFonts(props.siteId).then(async fonts => {
      for (const font of fonts) await registerLocalFont(font);
      if (active) setLoaded({fonts, error:""});
    }).catch(error => { if (active) setLoaded({fonts:[],error:`Font library: ${String(error)}`}); });
    return () => { active = false; };
  }, [props.siteId]);
  return loaded ? <StudioControls {...props} initialFonts={loaded.fonts} initialNotice={loaded.error} /> : <output data-template-studio-ui className={styles.status}>Loading style settings…</output>;
}
function StudioControls({ initialTokens, siteId, onExit, initialFonts, initialNotice }: StudioProps & {initialFonts:LocalFont[];initialNotice:string}) {
  const path = usePathname();
  const deviceKey=`template-studio-device:${siteId}`;
  const initialDevice=()=>{try{return sessionStorage.getItem(deviceKey) as StudioDevice|null;}catch{return null;}};
  const manualDevice=useRef(Boolean(initialDevice()));
  const [device,setDevice]=useState<StudioDevice>(()=>initialDevice()??(innerWidth<768?"mobile":"desktop"));
  const [viewport,setViewport]=useState(()=>innerWidth);
  const previewFrame=useRef<HTMLIFrameElement>(null);
  const framed=device==="mobile"?viewport>=768:viewport<768;
  const previewWidth=framed?(device==="mobile"?390:1440):viewport;
  function chooseDevice(next:StudioDevice){clearHighlights();setNotice("");manualDevice.current=true;setDevice(next);try{sessionStorage.setItem(deviceKey,next);}catch{}}
  useEffect(()=>{const resize=()=>{setViewport(innerWidth);if(!manualDevice.current)setDevice(innerWidth<768?"mobile":"desktop");};window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize);},[]);
  function activeDocument(){return framed?previewFrame.current?.contentDocument??document:document;}
  const input = useRef<HTMLInputElement>(null);
  const current = useRef(initialTokens);
  const fontInput = useRef<HTMLInputElement>(null);
  const pendingRole = useRef<TokenKey | null>(null);
  const [fonts, setFonts] = useState(initialFonts);
  const fontsRef = useRef(fonts); fontsRef.current = fonts;
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<ThemeTokens | null>(null);
  const customOptions = useMemo(() => fonts.map(font => ({value:fontStack(font),label:`Custom · ${font.name}`})), [fonts]);
  const history = useRef<StudioHistory | null>(null);
  const probeBusy = useRef(false);
  const presetSelections = useRef<Record<string, string> | null>(null);
  const [historyStatus, setHistoryStatus] = useState({ undo: 0, redo: 0 });
  const [reportOpen, setReportOpen] = useState(false);
  const [notice, setNotice] = useState(initialNotice);
  const controls = useMemo(() => tokenControls(initialTokens), [initialTokens]);
  const report = sourceReport as CoverageReport;
  const config = useMemo(() => {
    const config: DialConfig = {
      Undo: { type: "action", label: `Undo (${historyStatus.undo}) · ⌘/Ctrl Z` },
      Redo: { type: "action", label: `Redo (${historyStatus.redo})` },
      Reset: { type: "action", label: "Reset to site defaults" },
      Presets: { _collapsed: true, ...Object.fromEntries(Object.keys(themes).map((name) => [name, { type: "action", label: name }])) },
    };
    for (const [group, presets] of [["Typography", typographyPresets], ["Colors", colorPresets]] as const) {
      config[group] = { _collapsed: group !== "Typography", Preset: { type: "select", default: "original", options: [{value:"custom", label:"Custom"},{value:"original",label:"Site original"}, ...presets.map((preset, index) => ({value:String(index),label:preset.name}))] } };
    }
    const defaults = valuesFromTokens(initialTokens, controls);
    for (const control of controls) {
      const group = (config[control.group] ??= { _collapsed: true }) as DialConfig;
      const section = (group[control.section] ??= { _collapsed: true }) as DialConfig;
      if (inspectedSections[`${control.group}.${control.section}`]) section.Inspect = {type:"action",label:"Show on page"};
      const value = defaults[control.key];
      if (control.type === "fluid") {
        section[control.label] = { _collapsed: true,
          Mode: { type: "select", options: [{value:"fluid",label:"Adaptive"},{value:"fixed",label:"Fixed"}], default: String(defaults[control.key + ":mode"]) },
          "Fixed px": [Number(defaults[control.key + ":fixed"]), 0, 1600, 0.01],
          "Minimum px": [Number(defaults[control.key + ":min"]), 0, 1600, 0.01],
          "Viewport vw": [Number(defaults[control.key + ":vw"]), 0, 100, 0.0001],
          "Maximum px": [Number(defaults[control.key + ":max"]), 0, 1600, 0.01],
        };
        continue;
      }
      section[control.label] = control.type === "number" ? [Number(value), control.min, control.max, control.step]
        : control.type === "color" ? { type: "color", default: String(value) }
        : control.type === "font" ? { type: "select", options: fontOptions(control.key, String(value), customOptions), default: String(value) }
        : { type: "select", options: ["none", "invert(1)"], default: String(value) };
    }
    (config.Typography as DialConfig).Upload = {type:"action",label:"Upload font file…"};
    (config.Typography as DialConfig).Library = {type:"action",label:`Font library (${fonts.length})`};
    config.Coverage = { _collapsed: true, Highlight: false, Report: { type: "action", label: `Coverage: ${report.declarations.percentage}% declarations · ${report.tokens.filter((token) => token.uses > 0).length}/${report.tokens.length} tokens referenced` }, Clear: { type: "action", label: "Clear highlights" } };
    config.Theme = { _collapsed: true, Export: { type: "action", label: "Export theme.json" }, CSS: { type: "action", label: "Export theme.css" }, Import: { type: "action", label: "Import theme.json" }, Exit: { type: "action", label: "Exit style mode" } };
    return config;
  }, [controls, initialTokens, historyStatus, report, customOptions, fonts.length]);
  const dial = useDialKitController("Design tokens", config, {
    id: `template-studio:${siteId}`, persist: { key: `template-studio-values:${siteId}`, storage: "localStorage" },
    onAction(action) {
      try {
        if (action === "Undo" || action === "Redo") {
          const values = history.current?.[action === "Undo" ? "undo" : "redo"]();
          if (values) apply(tokensFromValues(values, controls, initialTokens), false);
          refreshHistory();
        } else if (action === "Reset") apply(initialTokens);
        else if (action.startsWith("Presets.")) apply(themes[action.slice(8) as keyof typeof themes]);
        else if (action === "Coverage.Report") setReportOpen((open) => !open);
        else if (action === "Coverage.Clear") { clearHighlights(); setNotice(""); }
        else if (action === "Typography.Upload") { pendingRole.current = null; fontInput.current?.click(); }
        else if (action === "Typography.Library") setLibraryOpen(open => !open);
        else if (action.endsWith(".Inspect")) {
          const section = inspectedSections[action.slice(0,-8)];
          if (section) {const count = inspectElements(section.selector,activeDocument()); setNotice(`${section.description} ${count} matching elements on this page.`);}
        }
        else if (action === "Theme.Export") download("theme.json", JSON.stringify({ version: 2, tokens: current.current, fonts:packFonts(fontsRef.current,current.current) }, null, 2));
        else if (action === "Theme.CSS") download("theme.css", fontCss(fontsRef.current,current.current)+themeCss(current.current), "text/css");
        else if (action === "Theme.Import") input.current?.click();
        else if (action === "Theme.Exit") { restoreOriginal(); onExit(); }
      } catch (error) { setNotice(String(error)); }
    },
  });
  const highlight = Boolean((dial.values.Coverage as Record<string, unknown>).Highlight);
  const values = useMemo(() => {
    const values: Record<string, string | number> = {};
    for (const control of controls) {
      const value = readPath(dial.values,controlPath(control));
      if (control.type === "fluid") {
        for (const [part,label] of Object.entries(fluidFields)) values[control.key+":"+part] = (value as Record<string,string|number>)[label];
      } else values[control.key] = value as string | number;
    }
    return values;
  }, [controls, dial.values]);
  function refreshHistory() { const next = history.current?.status ?? { undo: 0, redo: 0 }; setHistoryStatus((old) => old.undo === next.undo && old.redo === next.redo ? old : next); }
  function checked(candidate: unknown) {
    const tokens = validateTokens(candidate, initialTokens);
    for (const [key, value] of Object.entries(tokens)) if (!CSS.supports(tokenProperty(key as TokenKey), value)) throw new Error(`Invalid CSS for ${key}: ${value}`);
    return tokens;
  }
  function apply(candidate: unknown, record = true) {
    const next = checked(candidate);
    for (const control of controls) if (control.type === "font" && !fontOptions(control.key, initialTokens[control.key], fontsRef.current.map(font => ({value:fontStack(font),label:font.name}))).filter(option=>option.value!=="__upload_font__").some((option) => option.value === next[control.key])) throw new Error("Upload this font file first, or import a theme that includes it.");
    const nextValues = valuesFromTokens(next, controls);
    for (const control of controls) if (control.type === "number") {
      const steps=(Number(nextValues[control.key])-control.min)/control.step;
      if (Math.abs(steps-Math.round(steps))>1e-6) throw new Error(`${control.section} · ${control.label}: use increments of ${control.step}${control.unit}.`);
    }
    // Validate representability before changing controls; never silently change imported units.
    const roundTrip = tokensFromValues(nextValues, controls, initialTokens);
    for (const key of Object.keys(next) as TokenKey[]) if (roundTrip[key] !== next[key]) throw new Error(`Use ${controls.find((control) => control.key === key)?.unit || "a supported value"} for ${key}.`);
    if (record) { history.current ??= new StudioHistory(valuesFromTokens(current.current, controls)); history.current.end(); history.current.record(nextValues, Date.now(), true); }
    const groups: EditorTree = {};
    for (const control of controls) {
      const path = controlPath(control);
      if (control.type === "fluid") for (const [part,label] of Object.entries(fluidFields)) writePath(groups,[...path,label],nextValues[control.key+":"+part]);
      else writePath(groups,path,nextValues[control.key]);
    }
    dial.setValues(groups); refreshHistory();
  }
  useEffect(() => {
    if (!pendingTheme) return;
    try { apply(pendingTheme); } catch(error) {setNotice(String(error));}
    setPendingTheme(null);
  // Apply after the font selector has registered its new options.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTheme]);
  async function addFonts(added:LocalFont[]) {
    await saveLocalFonts(siteId,added);
    const merged = new Map(fontsRef.current.map(font => [font.family,font]));
    for (const font of added) merged.set(font.family,font);
    const next=[...merged.values()];fontsRef.current=next;setFonts(next);
  }
  function restoreOriginal() {
    clearHighlights();
    for (const [key, value] of Object.entries(initialTokens)) document.documentElement.style.setProperty(key, value);
    document.documentElement.removeAttribute("data-template-studio");
  }
  useEffect(() => {
    let frame = 0;
    try {
      const upload = controls.find(control => control.type === "font" && values[control.key] === "__upload_font__");
      if (upload) {
        pendingRole.current = upload.key;
        dial.setValue(controlPath(upload).join("."), current.current[upload.key]);
        fontInput.current?.click();
        return;
      }
      const next = checked(tokensFromValues(values, controls, initialTokens));
      const previousSelections = presetSelections.current;
      presetSelections.current ??= {};
      for (const [group, presets, category] of [["Colors", colorPresets, "color"], ["Typography", typographyPresets, "typography"]] as const) {
        const selected = String((dial.values[group] as Record<string, unknown>).Preset);
        if (previousSelections && selected !== previousSelections[group] && selected !== "custom") {
          presetSelections.current[group] = selected;
          const preset = selected === "original" ? null : presets[Number(selected)];
          if (selected === "original" || preset) { apply(applyStylePreset(next, initialTokens, preset, category)); return; }
        }
        const matched = selectedStylePreset(next, initialTokens, presets, category);
        presetSelections.current[group] = matched;
        if (selected !== matched) dial.setValues({[group]: {Preset:matched}});
      }
      const changed = Object.keys(initialTokens).filter((key) => current.current[key as TokenKey] !== next[key as TokenKey]);
      if (!changed.length && document.documentElement.getAttribute("data-template-studio") === "active") return;
      history.current ??= new StudioHistory(valuesFromTokens(current.current, controls));
      history.current.record(values);
      const before = changed.length ? capturePaint(activeDocument()) : [];
      for (const [key, value] of Object.entries(next)) document.documentElement.style.setProperty(key, value, "important");
      document.documentElement.setAttribute("data-template-studio", "active");
      current.current = next;
      window.dispatchEvent(new Event(THEME_EVENT));
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
        refreshHistory();
        if (changed.length) {
          const count = finishProbe(before, highlight);
          const control=changed.length===1?controls.find(control=>control.key===changed[0]):null;
          setNotice(`${control ? `${control.section} · ${control.label}` : "Theme"}: ${count} rendered elements responded on this page.`);
        }
      }); });
    } catch (error) { frame = requestAnimationFrame(() => setNotice(String(error))); }
    return () => cancelAnimationFrame(frame);
  // Controls are the source of edits; callbacks read the current controller and DOM.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, controls, initialTokens, highlight, dial.values]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable=true]")) return;
      if (event.shiftKey && event.code === "KeyD" && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); dial.setOpen(!dial.getOpen()); }
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.code === "KeyZ") {
        const next = history.current?.[event.shiftKey ? "redo" : "undo"]();
        if (next) { event.preventDefault(); apply(tokensFromValues(next, controls, initialTokens), false); }
      }
    }
    const begin = (event: PointerEvent) => { if ((event.target as HTMLElement).closest(".dialkit-root")) history.current?.begin(); };
    const end = () => history.current?.end();
    window.addEventListener("keydown", shortcut); window.addEventListener("pointerdown", begin, true); window.addEventListener("pointerup", end);
    return () => { window.removeEventListener("keydown", shortcut); window.removeEventListener("pointerdown", begin, true); window.removeEventListener("pointerup", end); };
  });
  useEffect(() => () => clearHighlights(), []);
  useEffect(() => { if (!highlight) clearHighlights(); }, [highlight]);
  useEffect(() => { clearHighlights(); const frame=requestAnimationFrame(()=>setNotice("")); return ()=>cancelAnimationFrame(frame); }, [path]);
  async function probe(key: TokenKey) {
    if (probeBusy.current) return;
    probeBusy.current = true;
    const root = activeDocument().documentElement;
    const previous = root.style.getPropertyValue(key), priority = root.style.getPropertyPriority(key);
    try {
      // Settle transitions before measuring; even reduced-motion rules can defer computed paint by a frame.
      if (tokenProperty(key) !== "transition-duration") root.setAttribute("data-template-studio-probing", "");
      const before = capturePaint(root.ownerDocument); root.style.setProperty(key, tokenProbeValue(key, getComputedStyle(root).getPropertyValue(key)), "important");
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const count = finishProbe(before, true);
      setNotice(`${key}: ${count} rendered elements respond here. Zero can mean a different viewport, page, or state.`);
    } finally { root.style.setProperty(key, previous, priority);
      // Flush the restored value before re-enabling transitions.
      getComputedStyle(root.ownerDocument.body).getPropertyValue("color");
      root.removeAttribute("data-template-studio-probing"); probeBusy.current = false; }
  }
  return <>
    <StudioPanel id={`template-studio:${siteId}`} controls={controls} values={values} device={device} width={previewWidth} onDevice={chooseDevice} frame={framed?previewFrame:undefined} route={path} onSize={next=>{try{apply(tokensFromValues(next,controls,initialTokens),false);}catch(error){setNotice(String(error));}}}/>
    {framed?<DevicePreview device={device} path={path} width={previewWidth} fonts={fonts} tokens={initialTokens} frame={previewFrame}/>:null}
    <style>{`html[data-template-studio-probing] body, html[data-template-studio-probing] body * { transition: none !important; } [data-studio-affected] { outline: 2px solid #e629bc !important; outline-offset: 2px !important; }`}</style>
    <input data-template-studio-ui ref={fontInput} data-testid="font-upload" type="file" hidden accept=".woff2,.woff,.ttf,.otf" onChange={async event => {
      const file=event.target.files?.[0];event.target.value="";
      if (!file) return;
      try {
        const font=await makeLocalFont(file);await registerLocalFont(font);await addFonts([font]);
        const role=pendingRole.current;pendingRole.current=null;
        if (role) setPendingTheme({...current.current,[role]:fontStack(font)});
        setLibraryOpen(true);setNotice(`${font.name} is available. Font files stay in this browser; exports include selected files.`);
      } catch(error) {setNotice(String(error));}
    }} />
    <input data-template-studio-ui ref={input} data-testid="theme-import" type="file" hidden accept=".json,application/json" onChange={async event => {
      const file=event.target.files?.[0];event.target.value="";
      try {
        if (!file) return;
        if(file.size>60*1024*1024)throw new Error("Theme file is too large.");
        const data=JSON.parse(await file.text());
        if (data.version && ![1,2].includes(data.version)) throw new Error("Unsupported theme version.");
        const tokens=checked(normalizedTheme(data.tokens??data,initialTokens,data.version!==2));
        const added=await unpackFonts(data.fonts);
        const available=[...fontsRef.current,...added];
        for (const key of ["--font-display","--font-lead","--font-body"] as const) {
          if(tokens[key].includes("StudioFont_")&&!available.some(font=>fontStack(font)===tokens[key]))throw new Error("Theme is missing a custom font file.");
        }
        if (added.length) {await addFonts(added);setPendingTheme(tokens);} else apply(tokens);
      } catch(error) {setNotice(String(error));}
    }} />
    {libraryOpen ? <aside data-template-studio-ui className={styles.report} aria-label="Local font library">
      <div className={styles.reportHeader}><h2>Local font library</h2><button onClick={()=>setLibraryOpen(false)}>Close fonts</button></div>
      <p>Choose WOFF2, WOFF, TTF or OTF files from your computer (up to 10 MB each). Files stay in this browser. Theme JSON and CSS exports include the selected font files.</p>
      <button onClick={()=>{pendingRole.current=null;fontInput.current?.click();}}>Choose font file…</button>
      {!fonts.length ? <p>No custom fonts yet.</p> : fonts.map(font=><section key={font.family} className={styles.fontCard}>
        <h3>{font.name}</h3><p style={{fontFamily:fontStack(font),fontSize:24}}>Aa Bb 0123 — The quick brown fox</p>
        <p>{font.fileName} · {Math.ceil(font.bytes.byteLength/1024)} KB</p>
        <div className={styles.fontDescriptors}><label>File weight<select value={font.weight} onChange={async event=>{try {const next={...font,weight:event.target.value};await registerLocalFont(next);await addFonts([next]);}catch(error){setNotice(String(error));}}}>{["100","200","300","400","500","600","700","800","900","100 900"].map(weight=><option key={weight} value={weight}>{weight==="100 900"?"Variable 100–900":weight}</option>)}</select></label>
        <label>File style<select value={font.style} onChange={async event=>{try {const next={...font,style:event.target.value as "normal"|"italic"};await registerLocalFont(next);await addFonts([next]);}catch(error){setNotice(String(error));}}}><option value="normal">Normal</option><option value="italic">Italic</option></select></label></div>
        <p>Set the weight/style contained in this file.</p>
        {[["--font-display","Titles"],["--font-lead","Lead paragraphs"],["--font-body","Body & interface"]].map(([key,label])=><button key={key} onClick={()=>apply({...current.current,[key]:fontStack(font)})}>Use for {label}</button>)}
      </section>)}
    </aside> : null}
    {notice ? <output data-template-studio-ui className={styles.status} aria-live="polite">{notice}</output> : null}
    {reportOpen ? <aside data-template-studio-ui className={styles.report} aria-label="Token coverage report">
      <div className={styles.reportHeader}><h2>Token coverage</h2><button onClick={() => setReportOpen(false)}>Close report</button></div>
      <p><strong>{report.declarations.percentage}%</strong> of audited style declarations use a token ({report.declarations.tokenized}/{report.declarations.total}).</p>
      <p>Static source audit, not a visual completeness score. Token references and live responses are different checks. Probe each token on the page, viewport, and state where it is used. The live probe compares up to 2,000 rendered HTML elements; image pixels, SVG paths and pseudo-elements are excluded.</p>
      <details open><summary>Tokens · {report.tokens.filter((token) => token.uses).length}/{report.tokens.length} referenced</summary>
        <ul>{report.tokens.map((token) => <li key={token.key}><code>{token.key}</code> · {token.uses} references <button onClick={() => probe(token.key as TokenKey)}>Probe</button>{!token.uses ? " · unused in audited source" : null}</li>)}</ul>
      </details>
      <details><summary>Hardcoded values · {report.gaps.length}</summary><ul>{report.gaps.map((gap, index) => <li key={index}><code>{gap.file}:{gap.line}</code><br /><code>{gap.property}: {gap.value}</code></li>)}</ul></details>
      <details><summary>Audit scope and exclusions</summary><ul>{report.exclusions.map((text) => <li key={text}>{text}</li>)}</ul></details>
    </aside> : null}
  </>;
}
