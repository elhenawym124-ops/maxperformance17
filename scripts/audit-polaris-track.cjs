#!/usr/bin/env node
/**
 * Polaris Track audit gate — taste-skill Section 16 conformance scorer.
 * Usage: node scripts/audit-polaris-track.cjs [paths...] [--json]
 * Scans .ts/.tsx/.jsx (excludes __tests__/*.test.*) and scores per area:
 *   palette   raw Tailwind palette classes (semantic tokens required)
 *   hex       raw hex colors inside JSX/class strings
 *   radius    rounded-2xl/3xl soup (Polaris scale is 8/12 via polaris-track)
 *   phys      physical directional utilities (ml-/mr-/pl-/pr-) — logical only
 *   reverse   divide-x-reverse (v3-ism, no-op in v4)
 *   emdash    em-dash in user-visible strings (taste-skill 9.G ban)
 * Track A areas (storefront/landing/auth) are reported separately, excluded from score.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "apps", "frontend", "src");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const scopes = args.filter((a) => !a.startsWith("--")).map((s) => path.join(ROOT, s.replace(/^apps\/frontend\/src\/?/, "")));
const roots = scopes.length ? scopes : [ROOT];

const TRACK_A = /(storefront|\/landing\/|\/auth\/|LandingPage)/;
const PALETTE = /(?:text|bg|border|ring|from|to|via|fill|stroke|divide|placeholder|shadow)-(?:rose|purple|violet|indigo|pink|cyan|blue|red|orange|teal|lime|fuchsia|emerald|amber|yellow|green|sky|slate|zinc|stone|neutral|gray)-\d{2,3}(?:\/\d+)?/g;
const HEX = /#[0-9a-fA-F]{6}\b/g;
const RADIUS = /rounded-(?:2xl|3xl)/g;
const PHYS = /\b(?:ml|mr|pl|pr)-\d+(?:\.\d+)?/g;
const REVERSE = /divide-x-reverse/g;
const EMDASH = /—/g;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name === "__tests__" || e.name === "node_modules") continue; yield* walk(p); }
    else if (/\.(tsx?|jsx)$/.test(e.name) && !/\.test\.|\.spec\./.test(e.name)) yield p;
  }
}

const areas = new Map();
for (const root of roots) {
  if (!fs.existsSync(root)) { console.error("missing scope:", root); process.exit(1); }
  for (const f of walk(root)) {
    const rel = path.relative(ROOT, f).replace(/\\/g, "/");
    const area = rel.includes("/") ? rel.split("/").slice(0, 2).join("/") : rel;
    const trackA = TRACK_A.test(rel);
    const src = fs.readFileSync(f, "utf8");
    const c = (re) => (src.match(re) || []).length;
    const v = { palette: c(PALETTE), hex: c(HEX), radius: c(RADIUS), phys: c(PHYS), reverse: c(REVERSE), emdash: c(EMDASH) };
    v.total = v.palette + v.hex + v.radius + v.phys + v.reverse + v.emdash;
    const a = areas.get(area) || { files: 0, clean: 0, trackAFiles: 0, palette: 0, hex: 0, radius: 0, phys: 0, reverse: 0, emdash: 0, total: 0, worst: [] };
    if (trackA) { a.trackAFiles++; continue; }
    a.files++;
    if (v.total === 0) a.clean++;
    for (const k of ["palette", "hex", "radius", "phys", "reverse", "emdash"]) a[k] += v[k];
    a.total += v.total;
    if (v.total > 0 && a.worst.length < 5) a.worst.push(`${rel} (${v.total})`);
    areas.set(area, a);
  }
}

const rows = [...areas.entries()].filter(([, a]) => a.files > 0).sort((x, y) => y[1].total - x[1].total);
const T = rows.reduce((s, [, a]) => ({ files: s.files + a.files, clean: s.clean + a.clean, total: s.total + a.total }), { files: 0, clean: 0, total: 0 });

if (asJson) {
  console.log(JSON.stringify({ areas: Object.fromEntries(rows), summary: { ...T, score: T.files ? Math.round((T.clean / T.files) * 100) : 100 } }, null, 2));
} else {
  console.log(`POLARIS TRACK AUDIT — clean ${T.clean}/${T.files} files (${T.files ? Math.round((T.clean / T.files) * 100) : 100}%) — ${T.total} violations\n`);
  console.log("area".padEnd(34), "files".padStart(5), "clean".padStart(6), "viol".padStart(5), "  pal hex rad phys rev em");
  for (const [name, a] of rows) {
    console.log(
      name.padEnd(34), String(a.files).padStart(5), String(a.clean).padStart(6), String(a.total).padStart(5),
      `  ${String(a.palette).padStart(3)} ${String(a.hex).padStart(3)} ${String(a.radius).padStart(3)} ${String(a.phys).padStart(3)} ${String(a.reverse).padStart(3)} ${String(a.emdash).padStart(3)}`
    );
  }
  const offenders = rows.filter(([, a]) => a.total > 0).slice(0, 3);
  if (offenders.length) {
    console.log("\nworst files:");
    for (const [, a] of offenders) for (const w of a.worst) console.log("  " + w);
  }
}
