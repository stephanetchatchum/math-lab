#!/usr/bin/env node
/**
 * Puts the Pyodide runtime + numpy/scipy/sympy/matplotlib (and their dependencies)
 * into public/pyodide so the site serves Python from its own origin (offline-capable, no CDN).
 *
 * Sources, in order:
 *   1. $PYODIDE_DIST — a local folder with an extracted Pyodide "full" release
 *   2. jsDelivr (per file, small download)          — used on Vercel
 *   3. the GitHub release tarball (~400 MB)          — last resort
 * Every package file is checked against the sha256 in pyodide-lock.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import os from 'node:os';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const versionTs = fs.readFileSync(path.join(root, 'src/py/version.ts'), 'utf8');
const VERSION = /PYODIDE_VERSION = '([^']+)'/.exec(versionTs)[1];
const PACKAGES = /PY_PACKAGES = \[([^\]]+)\]/.exec(versionTs)[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1));
const npmDir = path.join(root, 'node_modules/pyodide');
const dest = path.join(root, 'public/pyodide');
const CORE = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];

const npmVersion = JSON.parse(fs.readFileSync(path.join(npmDir, 'package.json'), 'utf8')).version;
if (npmVersion !== VERSION) {
  console.error(`pyodide npm package is ${npmVersion} but src/py/version.ts says ${VERSION}`);
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });
for (const f of CORE) fs.copyFileSync(path.join(npmDir, f), path.join(dest, f));
// Our root package.json is "type": "module"; Pyodide's asm.js is CommonJS when loaded by Node (npm run verify).
fs.writeFileSync(path.join(dest, 'package.json'), '{ "type": "commonjs" }\n');

const lock = JSON.parse(fs.readFileSync(path.join(dest, 'pyodide-lock.json'), 'utf8'));
const need = new Map();
const stack = [...PACKAGES];
while (stack.length) {
  const n = stack.pop();
  if (need.has(n)) continue;
  const p = lock.packages[n];
  if (!p) throw new Error(`Package ${n} not in pyodide-lock.json`);
  need.set(n, p);
  stack.push(...p.depends);
}

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const missing = [...need.values()].filter((p) => {
  const f = path.join(dest, p.file_name);
  return !(fs.existsSync(f) && sha(f) === p.sha256);
});

async function fromDir(dir) {
  for (const p of [...missing]) {
    const src = path.join(dir, p.file_name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(dest, p.file_name));
      missing.splice(missing.indexOf(p), 1);
    }
  }
}

async function fromCdn() {
  for (const p of [...missing]) {
    const url = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/${p.file_name}`;
    const r = await fetch(url).catch(() => null);
    if (!r || !r.ok) {
      console.warn(`  jsDelivr unavailable for ${p.file_name}`);
      return;
    }
    fs.writeFileSync(path.join(dest, p.file_name), Buffer.from(await r.arrayBuffer()));
    missing.splice(missing.indexOf(p), 1);
    console.log(`  ✓ ${p.file_name}`);
  }
}

async function fromTarball() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pyodide-'));
  const url = `https://github.com/pyodide/pyodide/releases/download/${VERSION}/pyodide-${VERSION}.tar.bz2`;
  console.log(`  downloading ${url} (large)…`);
  const names = missing.map((p) => `pyodide/${p.file_name}`).join(' ');
  execSync(`curl -sSL --retry 3 "${url}" | tar -xjf - -C "${tmp}" ${names}`, { stdio: 'inherit', shell: '/bin/bash' });
  await fromDir(path.join(tmp, 'pyodide'));
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (missing.length) {
  console.log(`Fetching ${missing.length} Pyodide package files…`);
  if (process.env.PYODIDE_DIST) await fromDir(process.env.PYODIDE_DIST);
  if (missing.length) await fromCdn();
  if (missing.length) await fromTarball();
}
for (const p of need.values()) {
  const f = path.join(dest, p.file_name);
  if (!fs.existsSync(f) || sha(f) !== p.sha256) {
    console.error(`✗ ${p.file_name} missing or corrupt`);
    process.exit(1);
  }
}

const files = [...CORE, ...[...need.values()].map((p) => p.file_name)].map((name) => ({
  name,
  size: fs.statSync(path.join(dest, name)).size,
}));
fs.writeFileSync(
  path.join(dest, 'manifest.json'),
  JSON.stringify({ version: VERSION, packages: [...need.keys()].sort(), files }, null, 1),
);
const mb = files.reduce((s, f) => s + f.size, 0) / 1e6;
console.log(`Pyodide ${VERSION}: ${files.length} files, ${mb.toFixed(1)} MB in public/pyodide ✓`);
