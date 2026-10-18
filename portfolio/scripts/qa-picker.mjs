import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.argv[2]||'http://localhost:3012',output=process.env.QA_OUTPUT||'.qa/picker';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const page=await browser.newPage({viewport:{width:888,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(180000);
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const settings=section=>page.locator(`[data-style-settings="${section}"]`);
const mode=async value=>{await page.getByRole('button',{name:value,exact:true}).click();};
const pick=async(selector,section,scope=page)=>{const target=scope.locator(selector).first();const box=await target.boundingBox();await target.click({position:{x:Math.min(40,box.width/2),y:Math.min(40,box.height/2)}});await page.locator(`[data-style-settings="${section}"][data-selected="true"]`).waitFor();};
const value=async(scope,label,number)=>{await scope.getByRole('slider',{name:label,exact:true}).press('Enter');const input=scope.getByRole('textbox',{name:label+' value',exact:true});await input.fill(String(number));await input.press('Enter');};
const size=(scope,number)=>value(scope,'Size (px)',number);
const readSize=(scope,selector)=>scope.locator(selector).first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
const expectSize=async(scope,selector,n)=>{await page.waitForFunction(({selector,n,framed})=>{const doc=framed?document.querySelector('iframe')?.contentDocument:document;const el=doc?.querySelector(selector);return el&&Math.abs(parseFloat(getComputedStyle(el).fontSize)-n)<0.02;},{selector,n,framed:scope!==page});assert.ok(Math.abs(await readSize(scope,selector)-n)<0.02);};
try{
 await page.goto(base+'/contact?studio=1',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Select layer',exact:true}).waitFor();
 // Regression: the real 888px host is Desktop; all Body consumers must follow the visible control.
 await page.getByRole('button',{name:'Body & interface',exact:true}).click();
 await size(settings('Typography.Body & interface'),31);
 for(const selector of ['.site-header','.site-footer__about-body',...(await page.locator('.contact-form').count()?['.contact-form__field','.contact-form__button']:[])])await expectSize(page,selector,31);
 await page.goto(base+'/office');await page.getByRole('button',{name:'All styles',exact:true}).waitFor();await expectSize(page,'.text-holder p',31);
 await mode('Select layer');assert.equal(await page.locator('[data-style-settings]').count(),0,'no settings until a layer is selected');
 const paint=await page.locator('html').getAttribute('style');await page.locator('h1').hover();await page.locator('h1[data-studio-hovered]').waitFor();
 await pick('h1','Typography.Titles');assert.equal(await page.locator('html').getAttribute('style'),paint);assert.equal(await settings('Typography.Body & interface').count(),0);assert.equal(await settings('Layout.Footer').count(),0);assert.equal(await page.getByText(/^Related styles/).count(),0);assert.equal(await page.getByRole('button',{name:'Show on page',exact:true}).count(),0);
 await size(settings('Typography.Titles'),100);await expectSize(page,'h1',100);
 await pick('.text-holder-large','Typography.Lead paragraphs');await pick('.site-footer__about-body','Typography.Body & interface');assert.equal(await settings('Typography.Titles').count(),0);
 await pick('.site-footer__disclaimer','Typography.Notes & credits');assert.equal(await settings('Typography.Body & interface').getByRole('slider',{name:'Size (px)',exact:true}).count(),0,'caption inherits family, not body size');
 await page.evaluate(()=>scrollTo(0,0));await page.locator('.site-header a[href*="/projects"]').click();assert.equal(new URL(page.url()).pathname,'/office','selection intercepts links');await page.keyboard.press('Escape');await page.locator('.site-header a[href*="/projects"]').click();await page.waitForURL('**/projects');
 const project=(await page.locator('.project-index__row--item').first().getAttribute('href')).replace(/\/$/,'');
 // Static home assets select their actual frame, with one relevant media setting.
 await page.goto(base+'/?studio=1');await mode('Select layer');await pick('.media-cover img','Components.Media');assert.equal(await settings('Components.Media').getByRole('slider').count(),1);assert.equal(await page.getByRole('button',{name:/Logo on page/}).count(),0);
 await value(settings('Components.Media'),'Frame corners',38);await page.waitForFunction(()=>getComputedStyle(document.querySelector('.media-cover')).borderTopLeftRadius==='38px');await page.waitForFunction(()=>getComputedStyle(document.querySelector('.media-cover img')).borderTopLeftRadius==='38px');
 // Move the whole panel with the library-style header, without folding or changing controls.
 const panel=page.locator('.dialkit-panel'),handle=page.getByRole('button',{name:'Move style panel',exact:true});
 const before=await panel.boundingBox(),grip=await handle.boundingBox();await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();await page.mouse.move(grip.x-300,grip.y+60,{steps:12});await page.mouse.up();
 await page.waitForFunction(x=>document.querySelector('.dialkit-panel').getBoundingClientRect().x<x-150,before.x);const after=await panel.boundingBox();assert.ok(after.x<before.x-150,'drag changes panel position');assert.equal(await page.getByRole('button',{name:'Design tokens',exact:true}).getAttribute('aria-expanded'),'true');
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:output+'/media-inspector.1440.png'});
 await page.reload();await page.getByRole('button',{name:'Move style panel',exact:true}).waitFor();const restored=await panel.boundingBox();assert.ok(restored.x<1100,'position persists in this tab');
 await handle.dblclick();await page.waitForFunction(()=>!document.querySelector('.dialkit-panel').style.left);await handle.press('ArrowLeft');await page.waitForFunction(()=>Boolean(document.querySelector('.dialkit-panel').style.left));await handle.press('Home');await page.waitForFunction(()=>!document.querySelector('.dialkit-panel').style.left);await mode('Select layer');await pick('.media-cover img','Components.Media');
 await page.getByRole('button',{name:'Mobile',exact:true}).click();const mobile=page.frameLocator('iframe[title="Mobile site preview"]');await mobile.locator('html[data-studio-preview-ready="true"]').waitFor();assert.equal(await page.locator('[data-style-settings]').count(),0,'device switch clears selection');
 await pick('.media-cover img','Components.Media',mobile);await value(settings('Components.Media'),'Frame corners',24);await page.waitForFunction(()=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('.media-cover')).borderTopLeftRadius==='24px');
 await mobile.locator('body').press('Escape');await page.goto(base+project);await mode('Select layer');await mobile.locator('html[data-studio-preview-ready="true"]').waitFor();
 await pick('.template-media-frame,.project-slide-wrap','Components.Media',mobile);await value(settings('Components.Media'),'Frame corners',30);await page.waitForFunction(()=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('.template-media-frame,.project-slide-wrap')).borderTopLeftRadius==='30px');
 await pick('h1','Typography.Titles',mobile);await size(settings('Typography.Titles'),96);await page.waitForFunction(()=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('h1')).fontSize==='96px');
 await page.screenshot({path:output+'/layer-mobile.1440.png'});
 await mobile.locator('body').evaluate(()=>scrollTo(0,0));await mobile.locator('.site-header a[href*="/contact"]').click();assert.equal(new URL(page.url()).pathname,project);await mobile.locator('h1').press('Escape');await mobile.locator('.site-header a[href*="/contact"]').click();await page.waitForURL('**/contact');await mobile.locator('html[data-studio-preview-ready="true"]').waitFor();await mode('Select layer');
 let submissions=0;await page.route('**/api/contact',route=>{submissions++;return route.fulfill({status:500,body:'{}'});});
 if(await mobile.locator('.contact-form').count()){
  await pick('.contact-form__field','Components.Form',mobile);assert.equal(await mobile.locator('.contact-form__field').first().evaluate(el=>el===document.activeElement),false);assert.equal(await settings('Colors.Buttons').count(),0);
  await size(settings('Typography.Body & interface'),27);await page.waitForFunction(()=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('.contact-form__field')).fontSize==='27px');
  await mobile.locator('[name="name"]').fill('Local QA');await mobile.locator('[name="email"]').fill('qa@example.invalid');await mobile.locator('[name="message"]').fill('Inspector verification. No mail delivery.');await pick('.contact-form__button','Components.Form',mobile);assert.equal(submissions,0);
 }
 await page.getByRole('button',{name:'Design tokens',exact:true}).click();await mobile.locator('body').evaluate(()=>scrollTo(0,0));await mobile.locator('.site-header a[href*="/office"]').click();await page.waitForURL('**/office');await page.getByRole('button',{name:'Design tokens',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.locator('iframe').waitFor({state:'detached'});await pick('h1','Typography.Titles');
 const phone=await panel.boundingBox();assert.ok(phone.x>=0&&phone.y>=0&&phone.x+phone.width<=391&&phone.y+phone.height<=845);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);writeFileSync(output+'/result.json',JSON.stringify({pass:true,checks:['tablet desktop Body size follows all real consumers','separate global and layer modes','only selected-layer settings','no Related styles or Show on page in layer mode','inheritance-aware caption and field settings','static home and case media corners','mobile preview live sizing and corners','header panel drag, persistence and reset','link/form interception with no mail delivery','Escape and collapse restore interactions','phone panel fits viewport'],browserErrors:errors},null,2));console.log('PASS: Body breakpoint, static media frames, focused layer inspector, mobile, dragging and normal interactions.');
}catch(error){await page.screenshot({path:output+'/failure.png'});throw error;}finally{await browser.close();}
