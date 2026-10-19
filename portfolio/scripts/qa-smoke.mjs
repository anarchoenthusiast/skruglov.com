import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:3011";
const output = process.env.QA_OUTPUT || ".qa";
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {}) });
const results = [];
mkdirSync(output,{recursive:true});
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport:{width,height:900}, reducedMotion:"reduce" });
    const browserErrors=[]; page.on("pageerror",error=>browserErrors.push(error.message));
    for (const locale of ["en","de"]) {
      const prefix=locale==="de"?"/de":"";
      for (const route of ["/","/projects/","/office/","/contact/","/impressum/","/datenschutz/"]) {
        const path=prefix+route;
        const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:180000});
        assert.equal(response.status(),200,path);
        await page.evaluate(()=>document.fonts.ready);
        assert.equal(await page.locator("html").getAttribute("lang"),locale,path);
        assert.equal(await page.locator("main").count(),1,path);
        assert.equal(await page.locator("h1").count(),1,path);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow: ${path} at ${width}`);
        const canonical=await page.locator('link[rel="canonical"]').getAttribute("href");
        assert.ok(!canonical.includes("/de/de/"),canonical);
        if(locale==="de") assert.ok(new URL(canonical).pathname.startsWith("/de"),canonical);
        assert.equal((await page.locator('a[hreflang]').getAttribute("href")).replace(/\/$/,""),(locale==="de"?route:"/de"+route).replace(/\/$/,""));
        assert.equal(await page.locator('a[hreflang]').isVisible(),true);
        results.push({path,width,status:"pass",theme:await page.locator("html").getAttribute("data-theme")});
      }
    }
    await page.goto(base+"/projects/",{waitUntil:"domcontentloaded",timeout:180000});
    await page.getByRole("tab").first().focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.getByRole("tab").nth(1).getAttribute("aria-selected"),"true");
    assert.ok(await page.locator(".projects-grid a").count()>0);
    const projectPath=await page.locator(".projects-grid a").first().getAttribute("href");
    assert.equal((await page.goto(base+projectPath,{waitUntil:"domcontentloaded",timeout:180000})).status(),200);
    await page.evaluate(()=>document.fonts.ready);
    assert.equal((await page.locator('a[hreflang]').getAttribute("href")).replace(/\/$/,""),("/de"+projectPath).replace(/\/$/,""));
    await page.getByRole("link",{name:/Switch language/}).click();
    await page.waitForURL("**/de/projects/**");
    await page.waitForFunction(()=>document.documentElement.lang === "de");
    assert.equal(await page.locator("html").getAttribute("lang"),"de");
    assert.equal(await page.locator("h1").count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`${output}/project.${width}.png`,fullPage:true});
    await page.goto(base+"/office/",{waitUntil:"domcontentloaded",timeout:180000});
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:`${output}/office.${width}.png`,fullPage:true});
    await page.screenshot({path:`${output}/preview.${width}.png`});
    await page.evaluate(()=>scrollTo(0,600)); await page.waitForTimeout(300);
    assert.ok(await page.locator("header").evaluate(el=>el.getBoundingClientRect().bottom<=1),"header hides on down scroll");
    await page.evaluate(()=>scrollTo(0,300)); await page.waitForTimeout(300);
    assert.ok(await page.locator("header").evaluate(el=>el.getBoundingClientRect().top>=-1),"header returns on up scroll");
    assert.deepEqual(browserErrors,[]);
    await page.close();
    console.log(`PASS viewport ${width}`);
  }
  const page=await browser.newPage();
  await page.goto(base+"/contact/",{waitUntil:"domcontentloaded",timeout:180000});
  if (await page.locator(".contact-form").count()) {
    let responseStatus=503;
    await page.route("**/api/contact",route=>route.fulfill({status:responseStatus,contentType:"application/json",body:JSON.stringify({ok:responseStatus===200})}));
    await page.locator('input[name="name"]').fill("Template QA");
    await page.locator('input[name="email"]').fill("qa@example.com");
    await page.locator('textarea[name="message"]').fill("A mocked template inquiry.");
    await page.locator('.contact-form button').click();
    await page.waitForFunction(()=>Boolean(document.querySelector(".contact-form__status")?.textContent?.trim()));
    const errorMessage=await page.locator(".contact-form__status").innerText();
    responseStatus=200;
    await page.locator('.contact-form button').click();
    await page.waitForFunction(()=>document.querySelector('input[name="name"]').value === "");
    assert.notEqual(await page.locator(".contact-form__status").innerText(),errorMessage);
    await page.unroute("**/api/contact");
  }
  assert.equal((await page.request.get(base+"/projects/template-smoke-missing-project/")).status(),404);
  const malformed=await page.request.post(base+"/api/contact",{data:"invalid",headers:{"Content-Type":"text/plain"}});
  assert.ok([400,404].includes(malformed.status()));
  const missingCredentials=await page.request.post(base+"/api/contact",{form:{name:"QA",email:"qa@example.com",message:"Template verification only."}});
  assert.ok([404,503].includes(missingCredentials.status()),"No credentials should send mail during QA");
  for(const path of ["/llms.txt","/llms-full.txt"]) assert.equal((await page.request.get(base+path)).status(),200);
  writeFileSync(`${output}/smoke.json`,JSON.stringify({passed:true,base,results},null,2));
  console.log(`PASS: ${results.length} route/viewport checks; project views, language switching, scroll header, contact failure, LLM files, no browser errors.`);
} finally { await browser.close(); }
