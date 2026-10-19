import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
import { freezeRelease, verifyRelease, planConsumer, prepareConsumer, verifyConsumer, promoteConsumer } from './lib/template-release.mjs';
const [command, ...args] = process.argv.slice(2);
const positional = args.filter(arg => !arg.startsWith('--'));
const value = key => args.find(arg => arg.startsWith('--' + key + '='))?.split('=').slice(1).join('=');
const options = { routes: value('routes')?.split(','), schemaVersion: value('schema-version') === undefined ? undefined : Number(value('schema-version')), ownership: value('ownership') };
const usages = { freeze: ['recipe.json', 'new-release'], verify: ['release'], plan: ['release', 'consumer'], prepare: ['release', 'consumer', 'new-candidate'], check: ['consumer'], promote: ['candidate', 'consumer'] };
try {
  if (!usages[command] || positional.length !== usages[command].length || args.some(arg => arg.startsWith('--') && !/^--(?:routes|schema-version|ownership)=/.test(arg)) || (options.ownership && options.ownership !== 'extend')) throw Error('Usage: template:release ' + Object.entries(usages).map(([name, params]) => name + ' ' + params.join(' ')).join(' | '));
  const p = positional.map(file => path.resolve(file));
  const result = await ({ freeze: () => freezeRelease(...p), verify: async () => { const r = await verifyRelease(p[0]); return { id: r.id, release: r.release, digest: r.digest, routes: r.routes, scope: r.acceptance.scope }; }, plan: () => planConsumer(...p, options), prepare: () => prepareConsumer(...p, options), check: () => verifyConsumer(...p), promote: () => promoteConsumer(...p) })[command]();
  console.log(JSON.stringify(result, null, 2));
  if (result.conflicts?.length) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
