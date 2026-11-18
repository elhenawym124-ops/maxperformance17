#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * 🔌 FRONTEND UNRESOLVED IMPORT GUARD
 *
 * Catches the failure class that killed three deploys on 2026-11-18:
 * `import { toast } from "react-hot-toast"` while the package is NOT in
 * apps/frontend/package.json → `vite: Rollup failed to resolve import` at build
 * time, roughly 20s into CI, after the change is already on main.
 *
 * This script is dependency-free and finishes in ~1s, so it can run in the
 * AST gate before `npm run build` and in a local pre-push hook.
 *
 * Two severities:
 *   - UNDECLARED PACKAGE  → hard error (exit 1). The build WILL fail.
 *   - UNRESOLVED PATH     → warning by default, hard error with --strict-paths.
 *     (A missing relative path may still resolve through a plugin alias, so it
 *     must not block the whole pipeline until the tree is proven clean.)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const STRICT_PATHS = process.argv.includes('--strict-paths');
const QUIET = process.argv.includes('--quiet');

const SOURCE_EXTS = ['.ts', '.tsx', '.js', '.jsx'];

const RESOLVE_EXTS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json',
  '.css', '.scss', '.sass', '.less',
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico',
  '.mp4', '.webm', '.mp3', '.wav', '.woff', '.woff2', '.ttf', '.otf',
];

const NODE_BUILTINS = new Set([
  'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 'crypto',
  'dgram', 'dns', 'events', 'fs', 'http', 'http2', 'https', 'inspector', 'module', 'net',
  'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline', 'repl',
  'stream', 'string_decoder', 'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads',
  'zlib',
]);

const VIRTUAL_PREFIXES = ['virtual:', 'vite:', '/@', '~', 'data:', 'http://', 'https://', 'node:'];

/* ---------- tsconfig path aliases ---------- */

function stripJsonc(text) {
  let out = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        out += ch;
      }
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    out += ch;
  }
  // Trailing commas are legal in tsconfig, illegal in JSON.parse
  return out.replace(/,(\s*[}\]])/g, '$1');
}

function loadAliases() {
  const aliases = [];
  const tsconfigPath = path.join(ROOT, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return aliases;
  const raw = stripJsonc(fs.readFileSync(tsconfigPath, 'utf8'));
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    if (!QUIET) console.warn('⚠️  tsconfig.json not parseable — alias resolution skipped');
    return aliases;
  }
  const opts = json.compilerOptions || {};
  const baseUrl = path.resolve(ROOT, opts.baseUrl || '.');
  const paths = opts.paths || {};
  for (const [pattern, targets] of Object.entries(paths)) {
    const target = Array.isArray(targets) ? targets[0] : targets;
    if (typeof target !== 'string') continue;
    aliases.push({
      prefix: pattern.replace(/\*$/, ''),
      hasWildcard: pattern.endsWith('*'),
      baseDir: baseUrl,
      targetPrefix: target.replace(/\*$/, ''),
    });
  }
  // Longest prefix first so "@/pages/x" wins over "@/*"
  aliases.sort((a, b) => b.prefix.length - a.prefix.length);
  return aliases;
}

/* ---------- package.json dependencies ---------- */

function loadDeps() {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = new Set();
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const name of Object.keys(pkg[field] || {})) deps.add(name);
  }
  return deps;
}

function packageNameOf(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/* ---------- file walking ---------- */

function collectSourceFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'coverage', '__snapshots__', '__tests__', '__mocks__'].includes(entry.name)) continue;
      collectSourceFiles(full, out);
    } else if (SOURCE_EXTS.some((ext) => entry.name.endsWith(ext))) {
      // Test/spec files are never part of the vite build graph.
      if (/\.(test|spec)\.[tj]sx?$/.test(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

/* ---------- specifier extraction ---------- */

const SPECIFIER_PATTERNS = [
  /(?:^|[^.\w$])from\s*['"]([^'"\n]+)['"]/g,                     // import … from 'x' | export … from 'x'
  /(?:^|[^.\w$])import\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,         // import('x')
  /(?:^|[^.\w$])require\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,        // require('x')
  /(?:^|[^.\w$])import\s+['"]([^'"\n]+)['"]/g,                   // side-effect import 'x'
];

const VALID_SPECIFIER = /^(?:\.{1,2}(?:\/[\w.@-]+)+|\/[\w.@/-]*|@?[A-Za-z0-9._-]+(?:\/[\w.@-]+)*)$/;

function isModuleSpecifier(spec) {
  if (!VALID_SPECIFIER.test(spec)) return false;
  if (/\s/.test(spec)) return false;
  return true;
}

function extractSpecifiers(code) {
  const found = new Set();
  // Drop block comments so commented-out imports do not create noise.
  const clean = code.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const re of SPECIFIER_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(clean)) !== null) {
      const spec = m[1].trim();
      if (!spec || spec.includes('${')) continue;
      if (!isModuleSpecifier(spec)) continue;
      found.add(spec);
    }
  }
  return [...found];
}

/* ---------- resolution ---------- */

function stripQuery(spec) {
  return spec.split('?')[0].split('#')[0];
}

function fileExistsAny(resolvedBase) {
  if (fs.existsSync(resolvedBase) && fs.statSync(resolvedBase).isFile()) return true;
  for (const ext of RESOLVE_EXTS) {
    if (fs.existsSync(resolvedBase + ext)) return true;
  }
  if (fs.existsSync(resolvedBase) && fs.statSync(resolvedBase).isDirectory()) {
    for (const ext of RESOLVE_EXTS) {
      if (fs.existsSync(path.join(resolvedBase, 'index' + ext))) return true;
    }
  }
  return false;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('❌ src/ not found — run from apps/frontend');
    process.exit(1);
  }

  const aliases = loadAliases();
  const deps = loadDeps();
  const files = collectSourceFiles(SRC_DIR);

  const undeclared = [];   // { file, spec }
  const unresolved = [];   // { file, spec }

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    if (!/import|require/.test(code)) continue;
    for (const rawSpec of extractSpecifiers(code)) {
      const spec = stripQuery(rawSpec);
      if (!spec) continue;
      if (VIRTUAL_PREFIXES.some((p) => spec.startsWith(p))) continue;

      let targetBase = null;

      if (spec.startsWith('.')) {
        targetBase = path.resolve(path.dirname(file), spec);
      } else if (spec.startsWith('/')) {
        // Vite serves /public at the root; nothing to resolve on disk here.
        continue;
      } else {
        const alias = aliases.find((a) => (a.hasWildcard ? spec.startsWith(a.prefix) : spec === a.prefix));
        if (alias) {
          const rest = alias.hasWildcard ? spec.slice(alias.prefix.length) : '';
          targetBase = path.resolve(alias.baseDir, alias.targetPrefix + rest);
        } else {
          const pkg = packageNameOf(spec);
          if (NODE_BUILTINS.has(pkg)) continue;
          if (!deps.has(pkg)) undeclared.push({ file, spec });
          continue;
        }
      }

      if (targetBase && !fileExistsAny(targetBase)) {
        unresolved.push({ file, spec });
      }
    }
  }

  const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
  let failed = false;

  if (undeclared.length) {
    failed = true;
    console.error(`\n❌ ${undeclared.length} UNDECLARED PACKAGE import(s) — the vite/rollup build WILL fail:`);
    for (const { file, spec } of undeclared) {
      console.error(`   ${rel(file)}  →  "${spec}"  (not in apps/frontend/package.json)`);
    }
    console.error('   Fix: use an already-declared library (e.g. sonner instead of react-hot-toast)');
    console.error('        or add the dependency with `npm install <pkg>` and commit package.json.\n');
  }

  if (unresolved.length) {
    const label = STRICT_PATHS ? '❌' : '⚠️ ';
    console.error(`${label} ${unresolved.length} relative/alias import(s) point at a missing file:`);
    const limit = process.argv.includes('--verbose') ? 200 : 10;
    for (const { file, spec } of unresolved.slice(0, limit)) {
      console.error(`   ${rel(file)}  →  "${spec}"`);
    }
    if (unresolved.length > limit) console.error(`   … and ${unresolved.length - limit} more (--verbose to list all)`);
    if (STRICT_PATHS) failed = true;
  }

  if (!failed) {
    if (!QUIET) {
      console.log(`✅ imports OK — ${files.length} source files scanned, all packages declared in package.json`);
      if (unresolved.length) console.log(`   (${unresolved.length} path warnings above)`);
    }
    process.exit(0);
  }
  process.exit(1);
}

main();
