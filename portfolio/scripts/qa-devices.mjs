import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
const base=process.argv[2]||"http://localhost:3012",output=process.env.QA_OUTPUT||".qa/devices";mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(180000);const errors=[];page.on("pageerror",error=>errors.push(error.message));
const folder=name=>page.locator('.dialkit-folder').filter({has:page.getByRole('button',{name,exact:true})}).last();
const open=async name=>{const button=page.getByRole('button',{name,exact:true});if(await button.getAttribute('aria-expanded')!=="true")await button.click();return folder(name);};
const size=async(scope,value)=>{await scope.getByRole('slider',{name:'Size (px)',exact:true}).press('Enter');const input=scope.getByRole('textbox',{name:'Size (px) value',exact:true});await input.fill(String(value));await input.press('Enter');};
const frame=()=>page.frameLocator('iframe[title="Mobile site preview"]');
try{
 await page.goto(base+'/projects',{waitUntil:'domcontentloaded'});const project=(await page.locator('.project-index__row--item').first().getAttribute('href')).replace(/\/$/,'');
 await page.goto(base+'/de'+project+'?studio=1',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Desktop',exact:true}).waitFor();
 const titles=await open('Titles');assert.equal(await titles.getByRole('slider',{name:'Size (px)',exact:true}).count(),1);assert.equal(await page.getByRole('slider',{name:'Size · mobile',exact:true}).count(),0);
 await size(titles,120);await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.querySelector('h1')).fontSize)-120)<0.01);
 const desktopToken=await page.locator('html').evaluate(el=>el.style.getPropertyValue('--font-size-title'));
 const defaultMobile=await page.locator('html').evaluate(el=>el.style.getPropertyValue('--font-size-title-mobile'));
 await page.screenshot({path:`${output}/desktop.1440.png`});
 await page.getByRole('button',{name:'Mobile',exact:true}).click();await frame().locator('html[data-studio-preview-ready="true"]').waitFor();
 assert.equal(await frame().locator('body').evaluate(()=>innerWidth),390);assert.equal(await frame().getByRole('button',{name:'Styles ⇧D'}).count(),0);assert.equal(await frame().getByRole('button',{name:'Design tokens',exact:true}).count(),0);
 await size(titles,132);await frame().locator('h1').evaluate(el=>getComputedStyle(el).fontSize);await page.waitForFunction(()=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('h1')).fontSize==='132px');
 assert.equal(await page.locator('html').evaluate(el=>el.style.getPropertyValue('--font-size-title')),desktopToken);assert.notEqual(defaultMobile,'132px');
 await titles.getByRole('button',{name:'Show on page',exact:true}).click();assert.equal(await frame().locator('h1[data-studio-affected]').count(),1);
 await open('Coverage');await page.getByRole('button',{name:/^Coverage:/}).click();const report=page.getByRole('complementary',{name:'Token coverage report'});await report.getByText('--font-size-title-mobile',{exact:true}).locator('..').getByRole('button',{name:'Probe',exact:true}).click();await frame().locator('h1[data-studio-affected]').waitFor();await page.waitForFunction(()=>!document.querySelector('iframe').contentDocument.documentElement.hasAttribute('data-template-studio-probing'));assert.equal(await frame().locator('h1').evaluate(el=>getComputedStyle(el).fontSize),'132px');await report.getByRole('button',{name:'Close report',exact:true}).click();
 await page.screenshot({path:`${output}/mobile.1440.png`});
 await page.getByRole('button',{name:/^Undo \(/}).click();await page.waitForFunction(value=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('h1')).fontSize===value,defaultMobile);
 await page.getByRole('button',{name:/^Redo \(/}).click();await page.waitForFunction(()=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('h1')).fontSize==='132px');
 await page.getByRole('button',{name:'Desktop',exact:true}).click();await page.locator('iframe').waitFor({state:'detached'});assert.ok(Math.abs(parseFloat(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontSize))-120)<0.01);
 await page.getByRole('button',{name:'Mobile',exact:true}).click();await frame().locator('html[data-studio-preview-ready="true"]').waitFor();
 // Local binary font must register in the preview document as well.
 await page.getByTestId('font-upload').setInputFiles('public/fonts/areal.woff2');const library=page.getByRole('complementary',{name:'Local font library'});await library.waitFor();await library.getByRole('button',{name:'Use for Titles',exact:true}).click();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('h1')).fontFamily.includes('StudioFont_'));
 assert.ok(await frame().locator('h1').evaluate(async el=>(await document.fonts.load('16px '+getComputedStyle(el).fontFamily)).length>0));await library.getByRole('button',{name:'Close fonts',exact:true}).click();
 await page.reload({waitUntil:'domcontentloaded'});await frame().locator('html[data-studio-preview-ready="true"]').waitFor();assert.equal(await frame().locator('h1').evaluate(el=>getComputedStyle(el).fontSize),'132px');
 // Global mode keeps ordinary navigation enabled.
 await page.getByRole('button',{name:'All styles',exact:true}).click();
 // Internal preview navigation follows the host route and keeps its device.
 const office=(await frame().locator('.site-header a[href*="/office"]').getAttribute('href'));await frame().locator('.site-header a[href*="/office"]').click();await page.waitForURL('**'+office.replace(/\/$/,''));await frame().locator('html[data-studio-preview-ready="true"]').waitFor();
 assert.equal(await frame().locator('body').evaluate(()=>innerWidth),390);await page.waitForFunction(()=>getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('h1')).fontSize==='132px');
 await page.getByRole('button',{name:'Desktop',exact:true}).click();await page.setViewportSize({width:390,height:844});const desktopFrame=page.frameLocator('iframe[title="Desktop site preview"]');await desktopFrame.locator('html[data-studio-preview-ready="true"]').waitFor();assert.equal(await desktopFrame.locator('body').evaluate(()=>innerWidth),1440);
 await page.getByRole('button',{name:'Mobile',exact:true}).click();await page.locator('iframe').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await open('Titles');assert.equal(await folder('Titles').getByRole('slider',{name:'Size (px)',exact:true}).count(),1);await page.screenshot({path:`${output}/mobile.390.png`});
 assert.deepEqual(errors,[]);writeFileSync(`${output}/result.json`,JSON.stringify({pass:true,checks:['one size control per device','adaptive desktop size visibly changes','mobile iframe has real 390px viewport','mobile 132px title visibly changes','independent sizes retained across switching','undo/redo in mobile preview','preview highlights actual title','local font loaded inside preview','device and values survive reload','preview navigation follows host route','desktop iframe at phone width','native mobile view has no frame or overflow'],browserErrors:errors},null,2));console.log('PASS: global device mode, real responsive previews, title sizing, history, fonts and navigation.');
}finally{await browser.close();}
