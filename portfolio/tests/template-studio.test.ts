import test from "node:test";
import assert from "node:assert/strict";
import { colorPresets, typographyPresets, applyStylePreset, selectedStylePreset } from "../src/theme/style-presets";
import { themes } from "../src/theme/presets";
import { tokenControls, valuesFromTokens, tokensFromValues, validateTokens, themeCss, normalizedTheme } from "../src/components/template-studio/schema";
import { StudioHistory } from "../src/components/template-studio/history";
test("the studio round-trips every shipped theme through canonical CSS tokens", () => {
  const controls = tokenControls(themes.brightfutures);
  for (const theme of Object.values(themes)) assert.deepEqual(tokensFromValues(valuesFromTokens(theme, controls), controls, themes.brightfutures), theme);
  assert.equal(new Set(controls.map((control) => `${control.group}.${control.section}.${control.label}`)).size, controls.length);
});
test("theme imports reject undeclared tokens and CSS injection, preserving valid partial overrides", () => {
  const original = themes.brightfutures;
  assert.equal(validateTokens({ "--font-size-title": "84px" }, original)["--font-size-title"], "84px");
  for (const value of [{"--unknown":"1px"},{"--color-body-bg":"red;display:none"},{"--font-body":"url(https://example.com/font)"},{"--color-body-bg":"not-a-color"}]) assert.throws(()=>validateTokens(value,original));
  const controls=tokenControls(original);const values=valuesFromTokens(original,controls);
  assert.throws(()=>tokensFromValues({...values,"--media-radius":NaN},controls,original));
  assert.match(themeCss(original),/--font-size-title: clamp\(/);
});
test("a drag is a single undo step; editing after undo clears redo", () => {
  const history=new StudioHistory({size:10});history.begin();history.record({size:11});history.record({size:12});history.end();
  assert.deepEqual(history.status,{undo:1,redo:0});assert.deepEqual(history.undo(),{size:10});assert.deepEqual(history.redo(),{size:12});
  history.undo();history.record({size:15},1000,true);assert.equal(history.status.redo,0);
});

test("adaptive size sliders preserve the full responsive range and fixed imports", () => {
  const controls = tokenControls(themes.brightfutures), baseline = valuesFromTokens(themes.brightfutures, controls);
  const changed = {...baseline,"--font-size-intro:vw":3.25,"--font-size-intro:min":34,"--font-size-intro:max":88};
  assert.equal(tokensFromValues(changed,controls,themes.brightfutures)["--font-size-intro"],"clamp(34px, 3.25vw, 88px)");
  const fixed = {...themes.brightfutures,"--font-size-title":"84px"};
  assert.deepEqual(tokensFromValues(valuesFromTokens(fixed,controls),controls,themes.brightfutures),fixed);
  assert.throws(()=>tokensFromValues({...changed,"--font-size-intro:min":100},controls,themes.brightfutures));
});
test("Are.na palette and typography selections are independent and undo can derive Custom", () => {
  let current = applyStylePreset(themes.brightfutures,themes.brightfutures,typographyPresets[0],"typography");
  for (const preset of colorPresets) {
    const next = applyStylePreset(current,themes.brightfutures,preset,"color");
    assert.equal(next["--font-body"],current["--font-body"]);
    assert.equal(next["--line-height-title"],current["--line-height-title"]);
    assert.equal(next["--page-gutter-desktop"],current["--page-gutter-desktop"]);
    assert.equal(selectedStylePreset(next,themes.brightfutures,colorPresets,"color"),String(colorPresets.indexOf(preset)));
    assert.equal(selectedStylePreset(next,themes.brightfutures,typographyPresets,"typography"),"0");
    current = next;
  }
  const colors = applyStylePreset(current,themes.brightfutures,null,"typography");
  assert.equal(colors["--color-body-bg"], current["--color-body-bg"]);
  assert.equal(colors["--font-body"], themes.brightfutures["--font-body"]);
  assert.equal(selectedStylePreset({...current,"--line-height-title":"1.5"},themes.brightfutures,typographyPresets,"typography"),"custom");
  assert.equal(colorPresets.length,4);
});


test("semantic role migration keeps old display paragraphs and body-based titles", async () => {
  const {migrateStudioValues} = await import("../src/components/template-studio/persistence");
  const migrated=migrateStudioValues({"Typography.Body font":"monospace","Typography.Display font":"Georgia, serif","Typography.Title size":"84px","Typography.Intro size.Mode":"fluid","Typography.Intro size.Minimum px":32,"Typography.Intro size.Viewport vw":3.4,"Typography.Intro size.Maximum px":72},themes.brightfutures)!;
  assert.equal(migrated["Typography.Titles.Font"],"monospace");
  assert.equal(migrated["Typography.Lead paragraphs.Font"],"Georgia, serif");
  assert.equal(migrated["Typography.Body & interface.Font"],"monospace");
  assert.equal(migrated["Typography.Titles.Size · desktop.Fixed px"],84);
  assert.equal(migrated["Typography.Lead paragraphs.Size · desktop.Viewport vw"],3.4);
  assert.equal(migrateStudioValues(migrated,themes.brightfutures),migrated);
  const tokens=normalizedTheme({"--font-body":"monospace","--font-display":"Georgia, serif","--font-size-legal":"18px","--font-weight-body":"500"},themes.brightfutures,true);
  assert.equal(tokens["--font-display"],"monospace");assert.equal(tokens["--font-lead"],"Georgia, serif");assert.equal(tokens["--font-weight-regular"],"500");
});


test("shipped numeric defaults lie on each slider's exact step grid", () => {
  const controls=tokenControls(themes.brightfutures);
  for(const theme of Object.values(themes))for(const control of controls)if(control.type==="number") {
    const steps=(parseFloat(theme[control.key])-control.min)/control.step;
    assert.ok(Math.abs(steps-Math.round(steps))<1e-6,`${control.key} must not drift when its editor mounts`);
  }
});


test("device filtering preserves canonical state and adaptive resizing follows the preview", async () => {
  const {controlDevice,displayedSize,resizedValues,visibleControls}=await import("../src/components/template-studio/device-model");
  const controls=tokenControls(themes.brightfutures),values=valuesFromTokens(themes.brightfutures,controls);
  const title=controls.find(control=>control.key==="--font-size-title")!,phone=controls.find(control=>control.key==="--font-size-title-mobile")!;
  assert.equal(controlDevice(title),"desktop");assert.equal(controlDevice(phone),"mobile");
  const meta=controls.map(control=>({path:[control.group,control.section,control.label].join("."),label:control.label,type:control.type==="fluid"?"folder" as const:"slider" as const}));
  const desktop=visibleControls(meta,controls,"desktop"),mobile=visibleControls(meta,controls,"mobile");
  assert.ok(!desktop.some(control=>control.path.endsWith("Size · mobile")));
  assert.ok(!mobile.some(control=>control.path.endsWith("Size · desktop")));
  const next=resizedValues(values,title.key,888,132);
  assert.ok(Math.abs(displayedSize(next,title.key,888)-132)<0.001);
  assert.equal(next[phone.key],values[phone.key]);assert.notDeepEqual(next,values);
  assert.equal(tokensFromValues(next,controls,themes.brightfutures)["--font-size-title-mobile"],themes.brightfutures["--font-size-title-mobile"]);
});
