import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const base=process.argv[2] || "http://localhost:3012";
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const output=process.env.QA_OUTPUT || ".qa/studio";mkdirSync(output,{recursive:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce",acceptDownloads:true});
const page=await context.newPage(),errors=[];page.on("pageerror",error=>errors.push(error.message));
page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(180000);
const folder=(name,scope=page)=>scope.locator('.dialkit-folder').filter({has:page.getByRole('button',{name,exact:true})}).last();
const open=async(name,scope=page)=>{const btn=scope.getByRole('button',{name,exact:true});if(await btn.getAttribute('aria-expanded')!=="true")await btn.click();return folder(name,scope);};
const slider=async(scope,name,value)=>{await scope.getByRole('slider',{name,exact:true}).press('Enter');const input=scope.getByRole('textbox',{name:name+' value',exact:true});await input.fill(String(value));await input.press('Enter');};
const select=async(scope,name,option)=>{await scope.getByRole('button',{name:new RegExp('^'+name+' ')}).click();await page.getByText(option,{exact:true}).click();};
const font=async(section,option)=>{const scope=await open(section);await select(scope,'Font',option);};
const families=()=>page.locator('h1, [data-type-role="lead"], .site-header, [data-type-role="body"], [data-type-role="caption"]').evaluateAll(els=>els.map(el=>[el.tagName,el.dataset.typeRole??el.className,getComputedStyle(el).fontFamily]));
const waitToken=(key,value)=>page.waitForFunction(([key,value])=>document.documentElement.style.getPropertyValue(key)===value,[key,value]);
let originalTokens={};
const reset=async()=>{await page.getByRole('button',{name:'Reset to site defaults',exact:true}).click();await waitToken('--font-display',originalTokens['--font-display']);};
const themeInput=()=>page.getByTestId('theme-import');
const importTheme=async(data)=>themeInput().setInputFiles({name:'theme.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
try {
  await page.goto(base+'/projects',{waitUntil:'domcontentloaded'});
  const projectPath=(await page.locator('.project-index__row--item').first().getAttribute('href')).replace(/\/$/,'');
  await page.goto(base+'/de'+projectPath,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  console.log('QA: loaded case');const canonicalKeys=JSON.parse(readFileSync(new URL('../src/theme/token-coverage.generated.json',import.meta.url),'utf8')).tokens.map(token=>token.key);originalTokens=await page.locator('html').evaluate((el,keys)=>Object.fromEntries(keys.map(key=>[key,getComputedStyle(el).getPropertyValue(key).trim()])),canonicalKeys);const baseline=await families();await page.getByRole('button',{name:'Styles ⇧D',exact:true}).click();await page.getByRole('button',{name:'Titles',exact:true}).waitFor();
  console.log('QA: opened panel');assert.deepEqual(await families(),baseline,'Opening panel preserves paint');
  assert.deepEqual(await page.locator('html').evaluate((el,keys)=>Object.fromEntries(keys.map(key=>[key,getComputedStyle(el).getPropertyValue(key).trim()])),Object.keys(originalTokens)),originalTokens,'Opening the panel preserves every canonical value without step rounding');
  assert.equal(await page.locator('.dialkit-text-control textarea').count(),0,'dimensions expose numeric controls');
  for(const [section,key]of [['Titles','--font-display'],['Lead paragraphs','--font-lead'],['Body & interface','--font-body']]) {
    console.log('QA: font role',section);await font(section,'monospace');await waitToken(key,'monospace');
    const painted=await families();
    for(let i=0;i<painted.length;i++){
      const role=painted[i][1],belongs=section==='Titles'?role==='display':section==='Lead paragraphs'?role==='lead':!['display','lead'].includes(role);
      assert.equal(painted[i][2],belongs?'monospace':baseline[i][2],`${section} must only affect its own role (${role})`);
    }
    await page.getByRole('button',{name:/^Undo \(/}).click();await waitToken(key,originalTokens[key]);
    await page.getByRole('button',{name:/^Redo \(/}).click();await waitToken(key,'monospace');await reset();
  }
  console.log('QA: numeric controls');const titles=folder('Titles'),desktop=await open('Responsive details',titles);
  await select(desktop,'Mode','Fixed');await slider(desktop,'Fixed px',84);await waitToken('--font-size-title','84px');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('h1')).fontSize==='84px');
  await titles.getByRole('button',{name:'Show on page',exact:true}).click();assert.equal(await page.locator('h1[data-studio-affected]').count(),1);
  await reset();
  console.log('QA: presets');const typography=folder('Typography');await select(typography,'Preset','Are.na · Areal');await waitToken('--font-lead','Areal, Arial, Helvetica, sans-serif');
  assert.ok(await page.evaluate(async()=>(await document.fonts.load('16px Areal')).length>0));
  const colors=await open('Colors');await select(colors,'Preset','Are.na Dusk');await waitToken('--color-body-bg','#16171E');
  assert.ok((await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily)).startsWith('Areal'));
  await page.screenshot({path:`${output}/semantic-roles.1440.png`});await reset();
  // Actual content-specified margins must respond, not only blocks with missing defaults.
  await importTheme({version:2,tokens:{'--project-hero-space':'86px'}});await waitToken('--project-hero-space','86px');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.project-wrap')).marginTop==='86px');await reset();
  // Real local font upload, selector sentinel, assignment and exports.
  console.log('QA: upload');const chooser=page.waitForEvent('filechooser');await select(titles,'Font','Custom font · Choose file…');await (await chooser).setFiles('public/fonts/areal.woff2');
  const library=page.getByRole('complementary',{name:'Local font library'});await library.waitFor();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('h1')).fontFamily.includes('StudioFont_'));
  const custom=await page.locator('html').evaluate(el=>el.style.getPropertyValue('--font-display'));
  const customPaint=await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily);
  assert.ok(await page.evaluate(async family=>(await document.fonts.load('16px '+family)).length>0,custom));
  await library.getByRole('button',{name:'Use for Lead paragraphs',exact:true}).click();await waitToken('--font-lead',custom);
  await page.screenshot({path:`${output}/local-fonts.1440.png`});
  await library.getByRole('button',{name:'Close fonts',exact:true}).click();
  const themeFolder=await open('Theme');
  async function exported(name,file){const pending=page.waitForEvent('download');await themeFolder.getByRole('button',{name,exact:true}).click();await (await pending).saveAs(`${output}/${file}`);return readFileSync(`${output}/${file}`,'utf8');}
  const bundled=JSON.parse(await exported('Export theme.json','theme-with-font.json'));
  assert.equal(bundled.version,2);assert.equal(bundled.fonts.length,1);assert.ok(bundled.fonts[0].data.length>1000);
  const portableCss=await exported('Export theme.css','theme-with-font.css');assert.match(portableCss,/@font-face .*data:font\/woff2;base64,/);
  console.log('QA: exported fonts');await page.reload({waitUntil:'domcontentloaded'});await waitToken('--font-display',custom);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('h1')).fontFamily.includes('StudioFont_'));
  await page.keyboard.press('Shift+D');await page.getByRole('link',{name:'Switch language to EN'}).click();await page.waitForURL('**'+projectPath);await waitToken('--font-display',custom);
  console.log('QA: locale persistence');
  // New browser profile proves JSON contains the font, rather than depending on a warm cache.
  const other=await browser.newPage({viewport:{width:1440,height:1000}});other.on('pageerror',error=>errors.push(error.message));
  await other.goto(base+projectPath+'?studio=1',{waitUntil:'domcontentloaded',timeout:180000});await other.getByTestId('theme-import').waitFor({state:'attached'});
  await other.getByTestId('theme-import').setInputFiles({name:'import.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bundled))});
  await other.waitForFunction(()=>getComputedStyle(document.querySelector('h1')).fontFamily.includes('StudioFont_'));
  assert.ok(await other.evaluate(async family=>(await document.fonts.load('16px '+family)).length>0,custom));await other.close();
  const cssPage=await browser.newPage();await cssPage.goto(base+projectPath,{waitUntil:'domcontentloaded',timeout:180000});await cssPage.addStyleTag({content:portableCss});assert.ok(await cssPage.evaluate(async family=>(await document.fonts.load('16px '+family)).length>0,custom));assert.equal(await cssPage.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),customPaint);await cssPage.close();
  if(await page.getByRole('button',{name:'Design tokens',exact:true}).getAttribute('aria-expanded')!=='true')await page.getByRole('button',{name:'Design tokens',exact:true}).click();await page.getByRole('button',{name:'Titles',exact:true}).waitFor();
  await page.getByTestId('font-upload').setInputFiles({name:'invalid.woff2',mimeType:'font/woff2',buffer:Buffer.from('This is not a font')});
  await page.waitForFunction(()=>document.querySelector('output')?.textContent.includes('Choose a WOFF2'));
  assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),customPaint);
  await reset();
  console.log('QA: portable fonts');
  // Legal and office route semantics use the same canonical roles.
  await importTheme({version:2,tokens:{'--font-display':'monospace','--font-lead':'Georgia, serif','--font-body':'Arial, sans-serif'}});await waitToken('--font-display','monospace');
  await page.goto(base+'/office',{waitUntil:'domcontentloaded'});await waitToken('--font-display','monospace');
  assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),'monospace');
  assert.equal(await page.locator('.text-holder-large').first().evaluate(el=>getComputedStyle(el).fontFamily),'Georgia, serif');
  await page.goto(base+'/datenschutz',{waitUntil:'domcontentloaded'});await waitToken('--font-display','monospace');
  assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),'monospace');
  assert.equal(await page.locator('.legal-shell p').first().evaluate(el=>getComputedStyle(el).fontFamily),'Arial, sans-serif');
  assert.equal(await page.locator('.legal-shell p').first().evaluate(el=>getComputedStyle(el).fontSize),'22px');
  await page.goto(base+projectPath,{waitUntil:'domcontentloaded'});await waitToken('--font-display','monospace');await reset();
  // Phone roles: one caption size and one navigation size (including locale).
  await page.setViewportSize({width:390,height:844});const notes=await open('Notes & credits');await slider(notes,'Size (px)',18);await waitToken('--font-size-small','18px');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.site-footer__disclaimer')).fontSize==='18px');
  if(await page.locator('[data-type-role="caption"]').count())assert.equal(await page.locator('[data-type-role="caption"]').first().evaluate(el=>getComputedStyle(el).fontSize),'18px');
  const headerSizes=await page.locator('.site-header__nav,.site-header__meta--lang').evaluateAll(els=>els.map(el=>getComputedStyle(el).fontSize));assert.equal(headerSizes[0],headerSizes[1]);
  await page.screenshot({path:`${output}/semantic-roles.390.png`});await page.keyboard.press('Shift+D');await page.locator('.site-footer__disclaimer').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/footer.390.png`});await page.keyboard.press('Shift+D');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await reset();
  // Live probe restores title paint; no intermediate font-family sentinel is applied.
  const coverage=await open('Coverage');await coverage.getByRole('button',{name:/^Coverage:/}).click();const report=page.getByRole('complementary',{name:'Token coverage report'});
  await report.getByText('--font-lead',{exact:true}).locator('..').getByRole('button',{name:'Probe',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-type-role="lead"][data-studio-affected]'));
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-template-studio-probing'));await report.getByRole('button',{name:'Close report',exact:true}).click();
  await open('Theme');await page.getByRole('button',{name:'Exit style mode',exact:true}).click();await page.getByRole('button',{name:'Styles ⇧D',exact:true}).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-template-studio'),null);
  const stored=await page.evaluate(()=>{const key=Object.keys(localStorage).find(key=>key.startsWith('template-studio-values:')&&!key.includes(':before-'));return {key,state:JSON.parse(localStorage.getItem(key))};});
  const legacyValues={'Typography.Body font':'monospace','Typography.Display font':'Georgia, serif','Typography.Title size':'108px'};
  const legacy={...stored.state,values:legacyValues,baseValues:legacyValues,presets:[{id:'legacy-proof',name:'Old typography',values:legacyValues}],activePresetId:null};
  const legacyPage=await browser.newPage();legacyPage.on('pageerror',error=>errors.push(error.message));
  await legacyPage.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:stored.key,state:legacy});
  await legacyPage.goto(base+projectPath+'?studio=1',{waitUntil:'domcontentloaded',timeout:180000});
  await legacyPage.waitForFunction(()=>getComputedStyle(document.querySelector('h1')).fontSize==='108px');
  assert.equal(await legacyPage.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),'monospace');
  assert.equal(await legacyPage.locator('[data-type-role="lead"]').first().evaluate(el=>getComputedStyle(el).fontFamily),'Georgia, serif');
  const migrated=await legacyPage.evaluate(key=>({state:JSON.parse(localStorage.getItem(key)),backup:localStorage.getItem(key+':before-semantic-roles')}),stored.key);
  assert.equal(migrated.state.presets[0].values['Typography.Titles.Size · desktop.Fixed px'],108);assert.equal(migrated.state.presets[0].values['Typography.Lead paragraphs.Font'],'Georgia, serif');assert.ok(migrated.backup.includes('108px'));await legacyPage.close();
  assert.deepEqual(errors,[]);writeFileSync(`${output}/result.json`,JSON.stringify({pass:true,checks:['unchanged paint on opening','three independent font roles','undo/redo/reset','adaptive/fixed numeric controls','component highlighting','independent Are.na presets','explicit block margin token binding','custom font chooser and real FontFace loading','local font reload and locale persistence','portable JSON font bundle in a fresh browser profile','self-contained CSS font export','invalid font rejection','office/legal shared typography','unified mobile captions and navigation','mobile panel fit','probe restoration','exit restoration','legacy roles and saved-version migration'],browserErrors:errors},null,2));
  console.log('PASS: semantic roles, local fonts, portable exports, history, presets, layout bindings, mobile and probes.');
} finally {await browser.close();}
