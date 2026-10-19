import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, appendFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
test("the strict audit rejects a new hardcoded design declaration", () => {
  const root=process.cwd(), fixture=mkdtempSync(join(tmpdir(),"template-token-audit-"));
  try {
    mkdirSync(join(fixture,"src/app"),{recursive:true});mkdirSync(join(fixture,"src/theme"),{recursive:true});
    cpSync(join(root,"src/components"),join(fixture,"src/components"),{recursive:true});
    cpSync(join(root,"src/app/globals.css"),join(fixture,"src/app/globals.css"));
    symlinkSync(join(root,"node_modules"),join(fixture,"node_modules"),"dir");
    const run=()=>spawnSync(process.execPath,["--import","tsx",join(root,"scripts/audit-tokens.ts"),"--strict"],{cwd:fixture,encoding:"utf8"});
    const baseline=run();assert.equal(baseline.status,0,baseline.stdout+baseline.stderr);
    appendFileSync(join(fixture,"src/app/globals.css"),"\n.audit-regression { color: #123456; }\n");
    const regression=run();assert.equal(regression.status,1,regression.stdout+regression.stderr);
    assert.match(regression.stderr,/zero authored design gaps/);
  } finally {rmSync(fixture,{recursive:true,force:true});}
});
