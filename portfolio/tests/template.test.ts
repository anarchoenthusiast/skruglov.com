import test from "node:test";
import assert from "node:assert/strict";
import { localizePath, stripLocale } from "../src/lib/localization";
import { buildMetadata } from "../src/content/site";
import { parseInquiry } from "../src/lib/contact";
import { getTheme, resolveThemeName } from "../src/theme/presets";
import { validateContent, type ContentInput } from "../src/lib/validate-content";
test("switch language without dropping the current route or duplicating the prefix", () => {
  assert.equal(localizePath("/projects/vana/", "de"), "/de/projects/vana/");
  assert.equal(localizePath("/de/projects/vana/", "de"), "/de/projects/vana/");
  assert.equal(localizePath("/de/projects/vana/", "en"), "/projects/vana/");
  assert.equal(stripLocale("/de"), "/");
  for (const path of ["https://example.org/path", "mailto:studio@example.org", "#credits", "//example.org"]) assert.equal(localizePath(path, "de"), path);
});
test("German canonical and hreflang share the same page with a single locale prefix", () => {
  const metadata = buildMetadata({ path: "/de/projects/vana/" });
  const canonical = String(metadata.alternates?.canonical);
  assert.ok(canonical.endsWith("/de/projects/vana/"));
  assert.ok(!JSON.stringify(metadata.alternates).includes("/de/de/"));
  assert.ok(String(metadata.alternates?.languages?.en).endsWith("/projects/vana/"));
});
test("contact rejects malformed fields and header injection, keeps honeypot semantics", () => {
  const valid = { name: "Ada", email: "ada@example.com", message: "A new project inquiry." };
  assert.equal(parseInquiry(valid).kind, "valid");
  for (const patch of [{name:"a\nb"}, {name:"a".repeat(201)}, {email:"bad"}, {message:"short"}, {message:"a".repeat(5001)}, {name:123}]) assert.equal(parseInquiry({...valid,...patch}).kind, "invalid");
  assert.equal(parseInquiry({...valid,website:"spam.example"}).kind, "bot");
});
test("all themes expose the same token API; unknown themes fail visibly", () => {
  const keys = Object.keys(getTheme("brightfutures")).sort();
  assert.deepEqual(Object.keys(getTheme("midnight")).sort(),keys);
  assert.deepEqual(Object.keys(getTheme("editorial")).sort(),keys);
  assert.notEqual(getTheme("midnight")["--color-body-bg"], getTheme("brightfutures")["--color-body-bg"]);
  assert.throws(()=>resolveThemeName("missing"));
});
test("validation catches duplicate slugs, missing assets, unsafe and unpublished links", () => {
  const project = {slug:"sample",name:"Sample",client:"Studio",coverImage:"/sample.svg",coverWidth:100,coverHeight:100,published:true};
  const input: ContentInput = {projects:[project],studies:{},home:[],site:{nav:[{href:"/projects/sample/"}]}};
  assert.deepEqual(validateContent(input,()=>true),[]);
  assert.match(validateContent({...input,projects:[project,project]},()=>true).join(),/Duplicate/);
  assert.match(validateContent(input,()=>false).join(),/asset/);
  assert.match(validateContent({...input,projects:[{...project,published:false}]},()=>true).join(),/Unavailable route/);
  assert.match(validateContent({...input,site:{href:"javascript:alert(1)"}},()=>true).join(),/Unsafe link/);
});
