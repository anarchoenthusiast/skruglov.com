import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {mkdtemp,readFile,readdir,mkdir,writeFile,lstat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {freezeRelease,safePath} from './lib/template-release.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [version,destination,...extra]=process.argv.slice(2);
if(!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(version??'')||!destination||extra.length)throw Error('Usage: template:package <semver> <new-release-directory>');
const target=path.resolve(destination);
if(target===source||target.startsWith(source+path.sep))throw Error('Release must be outside the source checkout');
try{await lstat(target);throw Error('Release destination exists');}catch(error){if(error.code!=='ENOENT')throw error;}
const git=(...args)=>execFileSync(process.env.GIT_BIN??'git',args,{cwd:source,encoding:'utf8'}).trim();
if(git('status','--porcelain'))throw Error('Commit source changes before packaging a versioned release.');
const commit=git('rev-parse','HEAD'),branch=git('branch','--show-current');
const config=JSON.parse(await readFile(path.join(source,'template.release.json'),'utf8'));
const root=await mkdtemp(path.join(tmpdir(),'brightfutures-release-')),seed=path.join(root,'seed');
const env={...process.env,SMTP_USER:'',SMTP_PASS:'',MIGADU_SMTP_USER:'',MIGADU_SMTP_PASS:'',QA_STUDIO:'false'};
delete env.QA_OUTPUT;
const run=(args,cwd=seed)=>new Promise((resolve,reject)=>{const child=spawn(args[0],args.slice(1),{cwd,env,stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(args.join(' ')+' failed: '+code)));});
let server;
try {
 await run([process.execPath,path.join(source,'scripts/create-template.mjs'),seed],source);
 await run(['npm','ci']);await run(['npm','run','check']);
 const listener=createServer();await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 let startupError;server=spawn(process.execPath,[path.join(seed,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:seed,env,stdio:'inherit'});server.once('error',error=>{startupError=error;});
 const base='http://127.0.0.1:'+port;let ready=false;
 for(let i=0;i<60;i++){if(startupError||server.exitCode!==null)throw startupError??Error('Release server exited');try{ready=(await fetch(base,{signal:AbortSignal.timeout(2000)})).ok;}catch{/* server is warming */}if(ready)break;await new Promise(resolve=>setTimeout(resolve,500));}
 if(!ready)throw Error('Release server did not start');
 await run(['npm','run','qa:smoke','--',base]);await run(['npm','run','qa:media','--',base]);
 const smoke=JSON.parse(await readFile(path.join(seed,'.qa/smoke.json'),'utf8'));
 const media=JSON.parse(await readFile(path.join(seed,'.qa/media/result.json'),'utf8'));
 if(!smoke.passed||!media.pass)throw Error('Gallery QA did not pass');
 const buildId=(await readFile(path.join(seed,'.next/BUILD_ID'),'utf8')).trim();
 await writeFile(path.join(seed,'.site-template-manifest.json'),JSON.stringify({version:1,id:config.id,routes:config.routes,accepted:true,acceptance:{buildId,scope:'native-template-build-and-browser-smoke',sourceParityGranted:false}}));
 const files={},ignored=new Set(['.git','.next','node_modules','.qa','verification','next-env.d.ts','tsconfig.tsbuildinfo']);
 async function scan(dir,prefix=''){for(const item of await readdir(dir,{withFileTypes:true})){if(ignored.has(item.name))continue;const file=prefix+item.name;safePath(file);if(item.isSymbolicLink())throw Error('Symlink in clean package: '+file);if(item.isDirectory())await scan(path.join(dir,item.name),file+'/');else files[file]=createHash('sha256').update(await readFile(path.join(dir,item.name))).digest('hex');}}
 await scan(seed);await mkdir(path.join(seed,'verification'));
 await writeFile(path.join(seed,'verification/release.json'),JSON.stringify({version:1,accepted:true,buildId,coreCommit:commit,scope:'native-template-build-and-browser-smoke',limits:['Clean starter and published consumer integration; no reconstruction pixel parity, content approval or production performance certification'],checks:{build:{passed:true,command:'npm run check'},smoke:{passed:true,cases:Array.isArray(smoke)?smoke.length:smoke.results?.length},gallery:{passed:true,viewports:media.viewports,locales:media.locales}},files},null,2)+'\n');
 const recipe={...config,release:version,source:seed,acceptance:'verification/release.json',provenance:{repository:'https://github.com/anarchoenthusiast/brightfutures-site',repositoryCommit:commit,branch,mode:'existing-source-template'}};
 const recipePath=path.join(root,'recipe.json');await writeFile(recipePath,JSON.stringify(recipe));
 // Freeze refuses an existing destination; no previous version is overwritten.
 console.log(JSON.stringify(await freezeRelease(recipePath,target),null,2));
}finally{if(server?.pid){server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}await rm(root,{recursive:true,force:true});}
