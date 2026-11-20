#!/usr/bin/env node
/**
 * Polaris tokenizer — mechanical raw-palette → semantic-token migration.
 * Usage: node scripts/polaris-tokenize.cjs <paths...> [--apply]
 * Without --apply: dry-run, prints per-file would-be replacement counts.
 * Rounds: exact pairs (proven wave-4 map) → chromatic hue regex → gray mapping → phys/radius/reverse.
 * Reported-only (manual): leftover palette, raw hex, em-dashes (9.G).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "apps", "frontend", "src");
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const targets = args.filter((a) => !a.startsWith("--"));

const PAIRS = [
  ["text-gray-900 dark:text-white", "text-foreground"],
  ["text-gray-900 dark:text-gray-100", "text-foreground"],
  ["text-gray-700 dark:text-gray-200", "text-foreground"],
  ["text-gray-700 dark:text-gray-300", "text-foreground"],
  ["text-gray-600 dark:text-gray-300", "text-muted-foreground"],
  ["text-gray-500 dark:text-gray-400", "text-muted-foreground"],
  ["text-gray-400 dark:text-gray-500", "text-muted-foreground/80"],
  ["hover:text-gray-800 dark:hover:text-gray-200", "hover:text-foreground"],
  ["bg-indigo-600 hover:bg-indigo-700", "bg-primary hover:bg-primary/90"],
  ["bg-purple-600 hover:bg-purple-700", "bg-primary hover:bg-primary/90"],
  ["text-indigo-600 dark:text-indigo-400", "text-primary"],
  ["hover:text-indigo-600 dark:hover:text-indigo-400", "hover:text-primary"],
  ["text-indigo-600 focus:ring-indigo-500", "text-primary focus:ring-primary"],
  ["border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 ring-1 ring-indigo-500/30", "border-primary bg-primary/10 ring-1 ring-primary/30"],
  ["bg-white dark:bg-gray-800", "bg-card"],
  ["bg-white dark:bg-gray-700", "bg-card"],
  ["hover:bg-gray-50 dark:hover:bg-gray-700", "hover:bg-muted/50"],
  ["hover:bg-gray-100 dark:hover:bg-gray-700", "hover:bg-muted"],
  ["hover:bg-gray-200 dark:hover:bg-gray-700", "hover:bg-muted"],
  ["hover:border-gray-300 dark:hover:border-gray-600", "hover:border-border"],
  ["border-gray-300 dark:border-gray-600", "border-border"],
  ["border-gray-200 dark:border-gray-600", "border-border"],
  ["bg-gray-100 dark:bg-gray-700", "bg-muted"],
  ["bg-gray-100 dark:bg-gray-700/50", "bg-muted"],
  ["bg-gray-50/80 dark:bg-gray-750/50", "bg-muted/60"],
];

const CHROMATIC = [
  [/(?:rose|red)/, "destructive"],
  [/(?:purple|violet|indigo|pink|fuchsia|blue)/, "primary"],
  [/(?:cyan|sky)/, "info"],
  [/(?:amber|yellow|orange)/, "warning"],
  [/(?:emerald|green|teal|lime)/, "success"],
];
// bg-<hue>-50 pale tints → bg-<sem>/10 ; any other shade → plain semantic token (keep /opacity)
const RE_CHROMA = /(?:^|\s)((?:(?:hover|focus|active|disabled|group-hover|dark|ltr|rtl|sm|md|lg|xl):){0,3})(text|bg|border|ring|from|to|via|fill|stroke|divide|shadow|accent|caret|outline|decoration)-(rose|red|purple|violet|indigo|pink|fuchsia|cyan|sky|amber|yellow|orange|emerald|green|teal|lime|blue)-(\d{2,3})(\/\d+)?/g;

const RE_GRAY = /(?:^|\s)((?:(?:hover|focus|active|disabled|group-hover|dark|ltr|rtl|sm|md|lg|xl):){0,3})(text|bg|border|ring|placeholder|divide)-(?:gray|slate|zinc|stone|neutral)-(\d{2,3})(\/\d+)?/g;

function mapGray(prefix, prop, shade) {
  const tone = prop === "text" ? (Number(shade) >= 600 ? "foreground" : "muted-foreground") : prop === "border" || prop === "divide" || prop === "ring" ? "border" : "muted";
  const prop2 = prop === "divide" ? "divide" : prop === "ring" ? "ring" : prop;
  return `${prefix}${prop2}-${tone}`;
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name === "__tests__" || e.name === "node_modules") continue; yield* walk(p); }
    else if (/\.(tsx?|jsx)$/.test(e.name) && !/\.test\.|\.spec\./.test(e.name)) yield p;
  }
}

const report = [];
for (const t of targets) {
  const abs = t.includes("/") || t.includes("\\") ? path.resolve(t) : path.join(ROOT, t);
  if (!fs.existsSync(abs)) { console.error("missing:", t); continue; }
  const files = fs.statSync(abs).isDirectory() ? [...walk(abs)] : [abs];
  for (const f of files) {
    let s = fs.readFileSync(f, "utf8");
    const before = s;
    let n = 0;

    for (const [a, b] of PAIRS) { const c = s.split(a).length - 1; if (c) { s = s.split(a).join(b); n += c; } }

    s = s.replace(RE_CHROMA, (m, pre, prop, hue, shade, op) => {
      const sem = CHROMATIC.find(([re]) => re.test(hue))[1];
      n++;
      if (prop === "bg" && shade === "50" && !op) return ` ${pre}${prop}-${sem}/10`;
      return ` ${pre}${prop}-${sem}${op || ""}`;
    });

    s = s.replace(RE_GRAY, (m, pre, prop, shade) => { n++; return " " + mapGray(pre, prop, shade); });

    // physical → logical (AGENTS.md §2.3)
    s = s.replace(/\bml-(\d+(?:\.\d+)?|auto|px)/g, (m, x) => { n++; return `ms-${x}`; });
    s = s.replace(/\bmr-(\d+(?:\.\d+)?|auto|px)/g, (m, x) => { n++; return `me-${x}`; });
    s = s.replace(/\bpl-(\d+(?:\.\d+)?|px)/g, (m, x) => { n++; return `ps-${x}`; });
    s = s.replace(/\bpr-(\d+(?:\.\d+)?|px)/g, (m, x) => { n++; return `pe-${x}`; });

    // radius soup → Polaris scale
    s = s.replace(/rounded-(?:2xl|3xl)/g, (m) => { n++; return "rounded-xl"; });

    if (s !== before && APPLY) fs.writeFileSync(f, s);
    if (n > 0) report.push(`${path.relative(ROOT, f).replace(/\\/g, "/")}: ${n}`);
  }
}
console.log(report.length ? report.join("\n") : "no replacements");
if (APPLY) console.log(`APPLIED files=${report.length}`);
