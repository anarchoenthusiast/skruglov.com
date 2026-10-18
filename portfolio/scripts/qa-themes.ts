import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { siteConfig } from "../src/content/site";
import { getTheme } from "../src/theme/presets";
import { colorPresets, typographyPresets, applyStylePreset } from "../src/theme/style-presets";
async function main() {
const base = process.argv[2] || "http://localhost:3012";
const output = process.env.QA_OUTPUT || ".qa/themes"; mkdirSync(output, { recursive: true });
const original = { ...getTheme(siteConfig.appearance.theme), ...siteConfig.appearance.tokens };
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const rgb = (hex: string) => { const full = hex.length === 4 ? hex.slice(1).split("").map(x => x+x).join("") : hex.slice(1); return `rgb(${[0,2,4].map(i => parseInt(full.slice(i,i+2),16)).join(", ")})`; };
const results: unknown[] = [];
const errors: string[] = [];
try {
  for (const width of (process.env.QA_WIDTHS?.split(",").map(Number) ?? [1440,390,320])) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    page.setDefaultTimeout(30000); page.setDefaultNavigationTimeout(180000);
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base + "/projects?studio=1", { waitUntil: "domcontentloaded" });
    const project = (await page.locator(".project-index__row--item").first().getAttribute("href"))!;
    await page.getByTestId('theme-import').waitFor({ state:"attached" });
    for (const palette of colorPresets) {
      const theme = applyStylePreset(applyStylePreset(original,original,typographyPresets[0],"typography"), original, palette,"color");
      await page.getByTestId('theme-import').setInputFiles({name:"theme.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({version:2,tokens:theme}))});
      const expected = rgb(theme["--color-body-bg"]);
      for (const locale of ["en","de"]) for (const route of ["/","/office","/projects",project,"/contact","/datenschutz"]) {
        const path = (locale === "de" ? "/de" : "") + route;
        const response = await page.goto(base+path, {waitUntil:"domcontentloaded"}); assert.equal(response!.status(),200,path);
        await page.waitForFunction(color => getComputedStyle(document.body).backgroundColor === color, expected);
        await page.waitForFunction(() => getComputedStyle(document.body).fontFamily.startsWith("Areal"));
        assert.equal(await page.evaluate(async () => (await document.fonts.load("16px Areal")).length > 0), true);
        assert.equal(await page.locator("html").getAttribute("lang"),locale);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        if (overflow) {
          await page.screenshot({path:`${output}/overflow.${width}.png`});
          console.error(await page.locator("body *").evaluateAll(nodes=>nodes.filter(el=>!el.closest(".dialkit-root,[data-template-studio-ui],nextjs-portal")).map(el=>({tag:el.tagName,class:el.className,text:el.textContent?.slice(0,80),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth})).filter(el=>el.left < -1 || el.right > innerWidth+1 || el.scroll > el.client+1).slice(0,12)));
        }
        assert.equal(overflow,false,`Overflow: ${palette.name} ${path} ${width}`);
        assert.equal(await page.locator(".site-footer").evaluate(el=>getComputedStyle(el).backgroundColor),rgb(theme["--color-footer-bg"]));
        assert.equal(await page.locator(".site-footer").evaluate(el=>getComputedStyle(el).color),rgb(theme["--color-footer-text"]));
        assert.equal(await page.locator(".brand-logo--inverted").evaluate(el=>getComputedStyle(el).filter),theme["--brand-footer-filter"]);
        assert.ok(await page.locator(".site-header").evaluate(el=>{
          const header=el.getBoundingClientRect();return [...el.querySelectorAll("a")].every(a=>a.getBoundingClientRect().bottom <= header.bottom+1);
        }),`Header fits: ${palette.name} ${path} ${width}`);
        if (route === "/contact" && await page.locator(".contact-form").count()) {
          const root = page.getByRole("button",{name:"Design tokens",exact:true});
          if (await root.isVisible() && await root.getAttribute("aria-expanded") === "true") await page.keyboard.press("Shift+D");
          const field=page.locator('.contact-form input[name="name"]');
          assert.equal(await field.evaluate(el=>getComputedStyle(el,"::placeholder").color),rgb(theme["--color-placeholder"]));
          await field.focus(); await page.keyboard.press("Tab");
          await page.waitForFunction(color=>getComputedStyle(document.querySelector('input[name="email"]')!).outlineColor===color,rgb(theme["--color-focus"]));
          assert.ok(await page.locator('input[name="email"]').evaluate(el=>el.matches(":focus-visible")));
          await page.locator(".contact-form__button").hover();
          await page.waitForFunction(color=>getComputedStyle(document.querySelector(".contact-form__button")!).backgroundColor===color,rgb(theme["--color-button-hover-bg"]));
          assert.equal(await page.locator(".contact-form__button").evaluate(el=>getComputedStyle(el).color),rgb(theme["--color-button-hover-text"]));
        }
        if (locale === "en" && route === "/office" && width !== 320) await page.screenshot({path:`${output}/${palette.name.replace(/[^a-z0-9]/gi,"-")}.${width}.png`});
        results.push({palette:palette.name,width,path,pass:true});
      }
    }
    await page.close(); console.log(`PASS Are.na palettes + Areal: ${width}`);
  }
  assert.deepEqual(errors,[]);
  writeFileSync(`${output}/result.json`,JSON.stringify({pass:true,cases:results.length,checks:["palette and loaded Areal across pages/locales","no overflow","header fit","footer roles and logo inversion","placeholder/focus/button-hover roles"],results,browserErrors:errors},null,2));
  console.log(`PASS: ${results.length} theme/page/locale/viewport cases, including form states.`);
} finally { await browser.close(); }

}
main().catch(error => { console.error(error); process.exitCode = 1; });
