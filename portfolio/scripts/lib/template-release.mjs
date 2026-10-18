import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile, lstat, rename, rm, mkdtemp } from 'node:fs/promises';
import path from 'node:path';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const save = async (file, value) => { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(value, null, 2) + '\n'); };
const ignored = new Set(['.git', '.next', 'node_modules', '.pagepilot', '.qa', 'verification', 'next-env.d.ts', 'tsconfig.tsbuildinfo']);
const lockName = 'template.lock.json';
const releaseName = 'template-release.json';

export function safePath(file, prefix = false) {
  const parts = typeof file === 'string' ? file.split('/') : [];
  if (typeof file !== 'string' || !file || file.includes('\\') || file.includes('\0') || path.isAbsolute(file) || parts.some((part, i) => part === '..' || part === '.' || (!part && !(prefix && i === parts.length - 1)))) throw Error('Unsafe package path: ' + file);
  if (file.split('/').some(part => ['.git', 'node_modules', '.next', '.env'].includes(part) || (part.startsWith('.env.') && part !== '.env.example'))) throw Error('Private/transient package path: ' + file);
  return file;
}
async function bytes(root, file) {
  safePath(file);
  let current = path.resolve(root);
  for (const part of file.split('/')) {
    current = path.join(current, part);
    try { if ((await lstat(current)).isSymbolicLink()) throw Error('Symlink in package: ' + file); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  return readFile(current);
}
async function exists(file) { try { await lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
async function inventory(root) {
  if ((await lstat(root)).isSymbolicLink()) throw Error('Package root must not be a symlink');
  const out = {};
  const visit = async (directory, relative = '') => {
    for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (ignored.has(item.name) || item.name === lockName || item.name.startsWith('.pagepilot-')) continue;
      const file = relative + item.name;
      if (item.isSymbolicLink()) throw Error('Symlink in package: ' + file);
      if (item.isDirectory()) await visit(path.join(directory, item.name), file + '/');
      else { safePath(file); out[file] = sha(await readFile(path.join(directory, item.name))); }
    }
  };
  await visit(root); return out;
}
const digest = files => sha(JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))));
const owned = (file, patterns) => patterns.some(pattern => pattern.endsWith('/') ? file.startsWith(pattern) : file === pattern);
function routes(values) {
  if (!Array.isArray(values) || !values.length || new Set(values).size !== values.length || values.some(value => typeof value !== 'string' || !/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]*$/.test(value))) throw Error('Invalid release routes');
  return [...values].sort();
}
function recipeValid(recipe) {
  if (recipe.version !== 1 || !/^[a-z0-9][a-z0-9-]*$/.test(recipe.id) || !/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(recipe.release) || !Number.isInteger(recipe.schemaVersion) || recipe.schemaVersion < 1) throw Error('Invalid release recipe/version');
  routes(recipe.routes);
  if (!Array.isArray(recipe.projectPaths) || !recipe.projectPaths.length) throw Error('Explicit project ownership required');
  recipe.projectPaths.forEach(file => safePath(file, true));
  if (recipe.projectPaths.some(file => /^(?:src\/generated\/|src\/lib\/|src\/components\/|package|data\/.*family\.json)/.test(file))) throw Error('Runtime/schema cannot be project-owned');
  for (const contract of recipe.contracts ?? []) { safePath(contract.schema); safePath(contract.documents, true); }
}
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const releaseDigest = manifest => { const inputs = { ...manifest }; delete inputs.digest; return sha(JSON.stringify(canonical(inputs))); };
const fieldsApi = fields => Object.fromEntries(Object.entries(fields ?? {}).map(([key, value]) => [key, { kind: value.kind, optional: !!value.optional, styles: Object.keys(value.stylePatterns ?? value.richTextPatterns ?? {}).sort() }]));
const listsApi = lists => Object.fromEntries(Object.entries(lists ?? {}).map(([key, value]) => [key, { uniqueVariants: !!value.uniqueVariants, patterns: Object.fromEntries(Object.entries(value.patterns).map(([name, pattern]) => [name, { fields: fieldsApi(pattern.fields), lists: listsApi(pattern.repeaters) }])) }]));
function familyApi(family) {
  return canonical({ version: family.version, id: family.id, prototypes: Object.fromEntries(Object.entries(family.prototypes).map(([key, value]) => [key, { fields: fieldsApi(value.fields), lists: listsApi(value.repeaters) }])), chrome: Object.fromEntries(Object.entries(family.chrome ?? {}).map(([key, value]) => [key, fieldsApi(value.fields)])) });
}

/** API compatibility check; the shipping renderer remains the complete value validator. */
export function validateDocumentApi(family, document) {
  if (family.version !== document.version || family.id !== document.family || !Array.isArray(document.blocks)) throw Error('Incompatible family/document');
  const fields = (schema, values, label) => {
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw Error('Missing fields: ' + label);
    for (const key of Object.keys(values)) if (!schema[key]) throw Error('Unknown field: ' + label + '.' + key);
    for (const [key, field] of Object.entries(schema)) if (!field.optional && (values[key] === undefined || values[key] === '')) throw Error('Missing field: ' + label + '.' + key);
  };
  const lists = (schema, values, label, depth = 0) => {
    if (depth > 8 || !values || typeof values !== 'object') throw Error('Invalid lists: ' + label);
    for (const key of Object.keys(values)) if (!schema[key]) throw Error('Unknown list: ' + label + '.' + key);
    for (const [key, repeater] of Object.entries(schema)) {
      if (!Array.isArray(values[key])) throw Error('Missing list: ' + label + '.' + key);
      const ids = new Set(), variants = new Set();
      for (const item of values[key]) {
        if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw Error('Duplicate/invalid item: ' + label); ids.add(item.id);
        const pattern = repeater.patterns[item.variant];
        if (!pattern || (repeater.uniqueVariants && variants.has(item.variant))) throw Error('Unknown/duplicate variant: ' + label); variants.add(item.variant);
        fields(pattern.fields, item.fields, label + '.' + key); lists(pattern.repeaters ?? {}, item.lists ?? {}, label + '.' + key, depth + 1);
      }
    }
  };
  for (const key of Object.keys(document.chrome ?? {})) if (!family.chrome?.[key]) throw Error('Unknown chrome: ' + key);
  for (const [key, value] of Object.entries(family.chrome ?? {})) fields(value.fields, document.chrome?.[key] ?? {}, 'chrome.' + key);
  const ids = new Set();
  for (const block of document.blocks) {
    if (typeof block.id !== 'string' || !block.id || ids.has(block.id)) throw Error('Duplicate/invalid block'); ids.add(block.id);
    const prototype = family.prototypes[block.prototype]; if (!prototype) throw Error('Unknown prototype: ' + block.prototype);
    fields(prototype.fields, block.fields, block.id); lists(prototype.repeaters, block.lists, block.id);
  }
}

export async function freezeRelease(recipeFile, destination) {
  const recipe = await json(recipeFile); recipeValid(recipe);
  const source = path.resolve(path.dirname(recipeFile), recipe.source), target = path.resolve(destination);
  if (target === source || target.startsWith(source + path.sep) || await exists(target)) throw Error('Release destination must be new and outside the accepted package');
  const receiptPath = safePath(recipe.acceptance ?? 'verification/release.json');
  const receiptBytes = await bytes(source, receiptPath), receipt = JSON.parse(receiptBytes);
  if (receipt.accepted !== true || receipt.checks?.build?.passed !== true || !Object.keys(receipt.files ?? {}).length || Object.values(receipt.checks ?? {}).some(check => check.passed !== true)) throw Error('A complete passing package receipt is required');
  const buffers = {};
  for (const [file, expected] of Object.entries(receipt.files)) {
    if (!/^[a-f0-9]{64}$/.test(expected)) throw Error('SHA256 package receipt required');
    const data = await bytes(source, file); if (!data || sha(data) !== expected) throw Error('Stale package receipt: ' + file);
    buffers[file] = data;
  }
  const siteBytes = await bytes(source, '.site-template-manifest.json'), site = JSON.parse(siteBytes);
  if (JSON.stringify(routes(site.routes)) !== JSON.stringify(routes(recipe.routes))) throw Error('Recipe routes do not match accepted package');
  if (site.accepted !== true || site.acceptance?.buildId !== receipt.buildId) throw Error('Package acceptance lineage mismatch');
  const apis = {};
  for (const contract of recipe.contracts ?? []) {
    if (!buffers[contract.schema] || !recipe.projectPaths.includes(contract.documents)) throw Error('Contract schema/documents must be in the verified graph and project ownership');
    const family = JSON.parse(buffers[contract.schema]); apis[contract.schema] = sha(JSON.stringify(familyApi(family)));
    for (const file of Object.keys(buffers).filter(file => file.startsWith(contract.documents) && file.endsWith('.json'))) validateDocumentApi(family, JSON.parse(buffers[file]));
  }
  await mkdir(path.dirname(target), { recursive: true });
  const stage = await mkdtemp(target + '.staging-');
  try {
    for (const [file, data] of Object.entries(buffers)) { await mkdir(path.dirname(path.join(stage, 'payload', file)), { recursive: true }); await writeFile(path.join(stage, 'payload', file), data); }
    const files = Object.fromEntries(Object.entries(buffers).map(([file, data]) => [file, sha(data)]));
    const manifest = { version: 1, id: recipe.id, release: recipe.release, schemaVersion: recipe.schemaVersion, routes: routes(recipe.routes), projectPaths: recipe.projectPaths, contracts: recipe.contracts ?? [], apiHashes: apis, files, digest: digest(files), createdAt: new Date().toISOString(), provenance: recipe.provenance ?? {}, acceptance: { receipt: 'source-receipt.json', hash: sha(receiptBytes), buildId: receipt.buildId, coreCommit: receipt.coreCommit, scope: receipt.scope, limits: receipt.limits, sourceParityGranted: false } };
    await writeFile(path.join(stage, 'source-receipt.json'), receiptBytes);
    await writeFile(path.join(stage, 'source-site-manifest.json'), siteBytes);
    manifest.acceptance.siteHash = sha(siteBytes);
    manifest.digest = releaseDigest(manifest);
    await save(path.join(stage, releaseName), manifest); await rename(stage, target);
    return { release: recipe.id + '@' + recipe.release, digest: manifest.digest, files: Object.keys(files).length, routes: manifest.routes, scope: manifest.acceptance.scope };
  } catch (error) { await rm(stage, { recursive: true, force: true }); throw error; }
}

export async function verifyRelease(directory) {
  const root = path.resolve(directory), manifest = await json(path.join(root, releaseName)); recipeValid(manifest);
  if (manifest.version !== 1 || releaseDigest(manifest) !== manifest.digest) throw Error('Invalid release digest');
  const receiptBytes = await bytes(root, manifest.acceptance.receipt), receipt = JSON.parse(receiptBytes);
  const siteBytes = await bytes(root, 'source-site-manifest.json'), site = JSON.parse(siteBytes);
  if (sha(receiptBytes) !== manifest.acceptance.hash || sha(siteBytes) !== manifest.acceptance.siteHash || receipt.accepted !== true || receipt.checks?.build?.passed !== true || Object.values(receipt.checks ?? {}).some(check => check.passed !== true) || site.accepted !== true || site.acceptance?.buildId !== receipt.buildId || JSON.stringify(routes(site.routes)) !== JSON.stringify(manifest.routes)) throw Error('Invalid release provenance');
  const actual = await inventory(path.join(root, 'payload'));
  if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(manifest.files)) || JSON.stringify(canonical(receipt.files)) !== JSON.stringify(canonical(manifest.files))) throw Error('Edited/incomplete release payload');
  for (const contract of manifest.contracts) if (sha(JSON.stringify(familyApi(await json(path.join(root, 'payload', contract.schema))))) !== manifest.apiHashes[contract.schema]) throw Error('Edited content API');
  return manifest;
}

async function validateContent(root, manifest) {
  const all = await inventory(root);
  for (const contract of manifest.contracts) {
    const family = await json(path.join(root, contract.schema));
    for (const file of Object.keys(all).filter(file => file.startsWith(contract.documents) && file.endsWith('.json'))) validateDocumentApi(family, await json(path.join(root, file)));
  }
}

export async function planConsumer(releaseRoot, consumerRoot, options = {}) {
  const release = await verifyRelease(releaseRoot), root = path.resolve(consumerRoot);
  const lock = await exists(path.join(root, lockName)) ? await json(path.join(root, lockName)) : null;
  const actual = await exists(root) ? await inventory(root) : {}, conflicts = [];
  let previousSeeds = lock?.projectSeedFiles ?? {};
  if (lock && !lock.projectSeedFiles) {
    const previous = await json(path.join(root, 'verification/template-lineage.json'));
    if (previous.digest !== lock.digest || releaseDigest(previous) !== lock.digest) throw Error('Missing/edited previous release lineage');
    previousSeeds = Object.fromEntries(Object.entries(previous.files).filter(([file]) => owned(file, lock.projectPaths)));
  }
  if (await exists(path.join(root, '.git'))) conflicts.push('Consumer must be a package directory, not a Git repository root');
  if (!lock && Object.keys(actual).length) conflicts.push('Initial installation requires a new directory');
  if (lock) {
    if (lock.version !== 1 || lock.id !== release.id) conflicts.push('Wrong consumer template identity');
    if (JSON.stringify(lock.projectPaths) !== JSON.stringify(release.projectPaths) && !(options.ownership === 'extend' && lock.projectPaths.every(file => owned(file, release.projectPaths)))) conflicts.push('Project ownership changed; explicitly extend it without removing existing project ownership');
    if (JSON.stringify(lock.routes) !== JSON.stringify(release.routes) && JSON.stringify(routes(options.routes ?? lock.routes)) !== JSON.stringify(release.routes)) conflicts.push('Routes changed; explicitly select the incoming route set');
    if ((lock.schemaVersion !== release.schemaVersion || JSON.stringify(canonical(lock.apiHashes)) !== JSON.stringify(canonical(release.apiHashes))) && options.schemaVersion !== release.schemaVersion) conflicts.push('Content API changed; explicitly acknowledge schemaVersion after migration');
    for (const [file, hash] of Object.entries(lock.managedFiles)) if (actual[file] !== hash) conflicts.push('Locally edited/deleted runtime: ' + file);
  }
  const changes = [], preserved = [];
  for (const [file, hash] of Object.entries(release.files)) {
    if (owned(file, release.projectPaths) && (actual[file] || Object.hasOwn(previousSeeds, file))) preserved.push(file);
    else if (actual[file] !== hash) {
      if (actual[file] && lock && !Object.hasOwn(lock.managedFiles, file) && !owned(file, release.projectPaths)) conflicts.push('Unowned file collision: ' + file);
      changes.push({ file, action: actual[file] ? 'update' : 'add' });
    }
  }
  for (const file of Object.keys(lock?.managedFiles ?? {})) if (!release.files[file]) changes.push({ file, action: 'remove' });
  return { release: release.id + '@' + release.release, digest: release.digest, from: lock?.release ?? null, routes: release.routes, schemaVersion: release.schemaVersion, changes, preserved, conflicts, baseDigest: digest(actual), baseLockHash: lock ? sha(await readFile(path.join(root, lockName))) : null, sourceParityGranted: false, productionReady: false };
}

/** Build an independent update; never write over the live consumer. */
export async function prepareConsumer(releaseRoot, consumerRoot, destination, options = {}) {
  const plan = await planConsumer(releaseRoot, consumerRoot, options), release = await verifyRelease(releaseRoot);
  if (plan.conflicts.length) throw Error(plan.conflicts.join('\n'));
  const root = path.resolve(consumerRoot), target = path.resolve(destination);
  if (target === root || target.startsWith(root + path.sep) || await exists(target)) throw Error('Candidate must be a new independent directory');
  await mkdir(path.dirname(target), { recursive: true }); const stage = await mkdtemp(target + '.staging-');
  try {
    const actual = await exists(root) ? await inventory(root) : {};
    if (digest(actual) !== plan.baseDigest) throw Error('Consumer changed during candidate preparation');
    for (const file of Object.keys(actual)) { const data = await bytes(root, file); await mkdir(path.dirname(path.join(stage, file)), { recursive: true }); await writeFile(path.join(stage, file), data); }
    for (const change of plan.changes) {
      const file = path.join(stage, change.file);
      if (change.action === 'remove') await rm(file);
      else { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, await bytes(path.join(releaseRoot, 'payload'), change.file)); }
    }
    await validateContent(stage, release);
    const managedFiles = Object.fromEntries(Object.entries(release.files).filter(([file]) => !owned(file, release.projectPaths)));
    const previousLock = plan.from ? await json(path.join(root, lockName)) : null;
    const previousFiles = previousLock ? (previousLock.projectSeedFiles ?? Object.fromEntries(Object.entries((await json(path.join(root, 'verification/template-lineage.json'))).files).filter(([file]) => owned(file, previousLock.projectPaths)))) : {};
    const projectSeedFiles = { ...previousFiles, ...Object.fromEntries(Object.entries(release.files).filter(([file]) => owned(file, release.projectPaths))) };
    const lock = { version: 1, id: release.id, release: release.release, digest: release.digest, routes: release.routes, schemaVersion: release.schemaVersion, apiHashes: release.apiHashes, contracts: release.contracts, projectPaths: release.projectPaths, projectSeedFiles, managedFiles, preparedAt: new Date().toISOString(), baseDigest: plan.baseDigest, baseLockHash: plan.baseLockHash, baseRoot: root, accepted: false, productionReady: false, sourceAcceptance: release.acceptance };
    await save(path.join(stage, lockName), lock);
    await save(path.join(stage, 'verification/template-lineage.json'), release);
    await rename(stage, target); return { ...plan, candidate: target, accepted: false };
  } catch (error) { await rm(stage, { recursive: true, force: true }); throw error; }
}

export async function verifyConsumer(root) {
  const lock = await json(path.join(root, lockName)), all = await inventory(root);
  for (const [file, hash] of Object.entries(lock.managedFiles)) if (all[file] !== hash) throw Error('Consumer runtime drift: ' + file);
  await validateContent(root, lock);
  return { id: lock.id, release: lock.release, routes: lock.routes, inputDigest: digest(all), lockHash: sha(await readFile(path.join(root, lockName))), files: Object.keys(all).length, integrity: true, accepted: false, productionReady: false };
}

/** Promotion requires a fresh build/smoke receipt and unchanged live inputs. */
export async function promoteConsumer(candidateRoot, targetRoot) {
  const candidate = path.resolve(candidateRoot), target = path.resolve(targetRoot);
  if (candidate === target || candidate.startsWith(target + path.sep) || target.startsWith(candidate + path.sep)) throw Error('Candidate and consumer must be independent');
  if (await exists(path.join(target, '.git')) || await exists(path.join(candidate, '.git'))) throw Error('Git repository roots cannot be promoted');
  const verified = await verifyConsumer(candidate), lock = await json(path.join(candidate, lockName));
  const receipt = await json(path.join(candidate, 'verification/consumer-smoke.json'));
  if (receipt.inputDigest !== verified.inputDigest || receipt.lockHash !== verified.lockHash || receipt.build !== true || receipt.smoke !== true || JSON.stringify(receipt.routes) !== JSON.stringify(lock.routes) || JSON.stringify(receipt.widths) !== JSON.stringify([390, 884, 1440])) throw Error('Fresh build/responsive smoke required before promotion');
  for (const route of lock.routes) for (const width of [390, 884, 1440]) if (!receipt.cases?.some(row => row.route === route && row.width === width && row.passed === true)) throw Error('Incomplete consumer smoke matrix');
  const current = await exists(target) ? await inventory(target) : {};
  const currentLockHash = await exists(path.join(target, lockName)) ? sha(await readFile(path.join(target, lockName))) : null;
  if (lock.baseRoot !== target || digest(current) !== lock.baseDigest || currentLockHash !== lock.baseLockHash) throw Error('Consumer changed since candidate preparation');
  // Rename whole directories so a partial file copy can never become the preview.
  const backup = target + '.previous-' + Date.now();
  if (await exists(target)) await rename(target, backup);
  try { await rename(candidate, target); }
  catch (error) { if (await exists(backup)) await rename(backup, target); throw error; }
  return { target, backup: await exists(backup) ? backup : null, release: lock.release, readiness: 'build-and-responsive-smoke', productionReady: false };
}
