// Trace static import graph from App.tsx; find paths reaching pages/orders or pages/settings
const fs = require("fs");
const path = require("path");

const SRC = "H:/maxp-platform/apps/frontend/src";
const TARGETS = ["/src/pages/", "/src/storefront/", "/src/components/dashboard/"];

function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) {
    base = path.resolve(SRC, spec.slice(2));
  } else if (spec.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else {
    return null; // bare package — ignore
  }
  const candidates = [
    base, base + ".ts", base + ".tsx", base + ".js", base + ".jsx",
    base.replace(/\.js$/, ".ts"), base.replace(/\.js$/, ".tsx"),
    path.join(base, "index.ts"), path.join(base, "index.tsx"), path.join(base, "index.js"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function getStaticImports(file) {
  const code = fs.readFileSync(file, "utf8");
  const specs = [];
  // top-level static imports: import ... from "spec";  (skip `import(` dynamic and `import type`)
  const re = /(?:^|\n)\s*import\s+(?!type\b)(?:[\s\S]*?from\s*)?["']([^"']+)["']\s*;/g;
  let m;
  while ((m = re.exec(code))) {
    if (code.slice(m.index, m.index + 200).includes("import(")) continue;
    specs.push(m[1]);
  }
  // also re-export: export ... from "spec";
  const re2 = /(?:^|\n)\s*export\s+[\s\S]*?from\s*["']([^"']+)["']\s*;/g;
  while ((m = re2.exec(code))) specs.push(m[1]);
  return specs;
}

const root = path.resolve(SRC, "App.tsx");
const visited = new Set();
const offenders = []; // {via: chain, file}

function walk(file, chain) {
  if (visited.has(file)) return;
  visited.add(file);
  const norm = file.replace(/\\/g, "/");
  const isTarget = TARGETS.some((t) => norm.includes(t));
  if (isTarget) {
    offenders.push({ chain: chain.concat(norm).map((p) => p.replace(SRC, "")), file: norm });
    return; // don't expand deeper into route chunk
  }
  for (const spec of getStaticImports(file)) {
    const resolved = resolveImport(file, spec);
    if (resolved) walk(resolved, chain.concat(norm));
  }
}

walk(root, []);
console.log(`visited ${visited.size} modules; offenders: ${offenders.length}`);
const unresolved = [];
function collectUnresolved() {
  for (const f of visited) {
    for (const spec of getStaticImports(f)) {
      if (!resolveImport(f, spec)) {
        const bare = !spec.startsWith(".") && !spec.startsWith("@/");
        if (!bare) unresolved.push(`${f.replace(SRC, "")} -> ${spec}`);
      }
    }
  }
}
collectUnresolved();
if (unresolved.length) {
  console.log(`\n!! unresolved relative/alias imports (${unresolved.length}):`);
  unresolved.slice(0, 10).forEach((u) => console.log("  " + u));
}
const uniqVia = new Map();
for (const o of offenders) {
  const key = o.chain[1] || "(direct)";
  if (!uniqVia.has(key)) uniqVia.set(key, []);
  uniqVia.get(key).push(o.chain.join("\n    -> "));
}
for (const [via, chains] of uniqVia) {
  console.log(`\n### via ${via} (${chains.length} files)`);
  chains.slice(0, 6).forEach((c) => console.log("  " + c.replace(/\n    -> /g, " -> ")));
}
