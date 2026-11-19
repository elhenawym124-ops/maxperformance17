# AGENTS.md — MaxP Platform Master Workspace Laws

> **Master Constitution:** This file is the single source of truth for all autonomous and human-collaborative agent sessions across the MaxP platform. Every rule here is mandatory and non-negotiable.

---

## ⚡ 1. Default Execution Mode: Automatic Ponytail + Caveman
1. **Automatic Ponytail (Zero Code Bloat):** Always implement the leanest, smallest possible change that fully and robustly solves the task. Ban speculative abstractions, unnecessary wrapper classes, and superfluous dependencies.
2. **Automatic Caveman (Zero Conversational Fluff):** Deliver answers and code first. Strip pleasantries, narrations of routine steps, recaps, and conversational padding. Keep all technical facts, code, diffs, and exact error strings verbatim.
3. **Zero UI Copy Bloat (Show, Don't Tell):** UI controls must be self-evident. Never inject explanatory subtitles, instructional paragraphs, or marketing fluff under headers, cards, or buttons.

---

## 🎨 2. MaxP Official Design System: The Petrol & Persimmon Standard
> **Domain-Aware Standard:** MaxP is an Arabic-first Enterprise E-Commerce & Business Operations OS. It is NOT a developer IDE console or a low-level terminal.

### A. The Signature Palette (الملائمة القطاعية الرسمية)
* **Primary / Ink:** Deep Petrol (`--petrol: #013735`, hover: `#014744`, tint: `#e6f1ef`, text: `#0a1e1d`).
* **Accent / Action / Signal:** Warm Persimmon (`--accent: #e2603f`, ink: `#b83d1c`, tint: `#fef0eb`, line: `#f8cfc3`).
* **Base Surfaces:** Natural Warm Paper (`--paper: #f4f6f5`), Porcelain White (`--surface: #ffffff`), Subtle (`--subtle: #fafbfb`).
* **Dividers & Borders:** Hairline Zinc (`--line: #d8e2df`, `--line-soft: #e7eeec`).
* **Dark Mode Pairing:** Deep Graphite Teal (`--paper: #081110`, `--surface: #0e1a19`, `--petrol: #3ec8b7`, `--accent: #ff8a68`).
* **Permanent Ban on Developer Terminal Themes on Business Pages:** Pitch-black OLED (`#000000`), cyber neon, and raw terminal styling are strictly banned on customer-facing, merchant, clinic, or commerce screens.

### B. Typography & Micro-Typography
* **Official Primary Typography:** `IBM Plex Sans Arabic` for all Arabic UI copy, headings, and labels.
* **Official Monospace & Telemetry:** `IBM Plex Mono` with `font-variant-numeric: tabular-nums` (or `tabular-nums`) strictly for digits, currency blocks (`EGP`), order counts, timestamps, route paths, and keyboard badges (`kbd`).
* **Arabic Typography Integrity:** NEVER apply monospace (`font-mono`) to Arabic words as it breaks cursive character connections.
* **Micro-Typography Rules:** Mandatory `text-wrap: balance` on headings, `text-pretty` on body copy, non-breaking spaces before units (`10&nbsp;MB`, `0.8&nbsp;s`, `⌘&nbsp;K`), and true quotes (`“ ”`).

### C. Architectural Chassis & The "Hub & Drawer" Pattern
* **Linear-Caliber Clarification (فك الاشتباك):** When rules cite "Linear/Cursor caliber", this strictly refers to **hairline borders (`border-border/70`), spring micro-haptics (`:active scale(0.97)`), and keyboard-first shortcuts (`⌘K`, `1–5`)** — it DOES NOT mean copying dark developer terminal themes.
* **Single-Surface Chassis:** Workspaces and dashboards must be a single continuous surface separated by clean hairline dividers, banning floating islands separated by wide grey gaps.
* **Hub & Drawer / Grouped Navigation:** For dense multi-app launchers and cockpits, group tools into 5 primary operational Hubs with smooth CSS grid drawer unfolding (`grid-template-rows: 0fr -> 1fr`) or clear grouped sections, avoiding unorganized flat circle grids.

### D. The 12 Banned AI Slop Flags
1. Zero Emoji Littering in headers, badges, or titles (`🤖`, `🚀`, `⚡`, `✨`, `🔥`, `💡`, `🎯`, `🛒`, `🧠`).
2. Ban Purple/Cyan Dark Mesh gradients.
3. Ban Cookie-Cutter Symmetrical Card Clones.
4. Ban Marketing Buzzword Fluff ("الذكاء الاصطناعي الخارق").
5. Ban Everything-Is-Glassmorphism (`backdrop-blur bg-white/5` spam).
6. Ban Fake Glowing Rainbow Borders & Shimmer Spam.
7. Ban Floating Island Fragmentation.
8. Ban Stock 3D Cartoon Avatars.
9. Ban The Centered Hero Trap.
10. Ban Dead Unclickable Badges.
11. Ban Developer Jargon (P95, model names) on business landing pages.
12. Ban Meta-Explanatory Clutter in Production UI (no "Taste vs Slop" toggles, no before/after pills, no rule codes `ANTI_SLOP_P01` in client-facing code).

---

## 🛡️ 3. Strict Change Isolation (Zero Blast-Radius) & Safe Evolution
1. **Mandatory Pre-Edit Audit (`grep`):** Before modifying any shared component, hook, or API endpoint, verify all references across the codebase.
2. **Specialize Over Mutating Shared Core:** If a specific screen needs custom behavior or layout, create a page-scoped wrapper or additive optional prop. Never mutate shared defaults in ways that break other screens.
3. **No Legacy Flaw Cloning (تحرير الابتكار في الصفحات الجديدة):** Strict isolation prevents regressions on existing screens; it **DOES NOT** mean copying outdated 2018 templates or bad design patterns when creating **NEW** pages or modules. New pages MUST be built using the MaxP Petrol & Persimmon standard.
4. **Dedicated Route & State Isolation:** Every functional screen must maintain its own localized state and Error Boundary. Group related domain screens under modular feature folders (< 300–400 lines per file).

---

## 🔐 4. Zero Secrets in Filesystem (Mandatory Database Storage in `public.ai_keys`)
1. **Ban AI API Keys in `.env`:** NEVER store, hardcode, or read AI API keys (Google, Gemini, OpenAI, Anthropic, DeepSeek, Groq, etc.) from `.env` or configuration files.
2. **Mandatory PostgreSQL Storage:** All AI keys MUST be resolved dynamically from `public.ai_keys` (`WHERE isActive = true ORDER BY priority ASC`), scoped by tenant (`companyId`) or platform-wide (`CENTRAL`).

---

## 🔗 5. Cross-Agent Coordination & The Protected Git Push Gate
> **Multi-Agent Workspace Law:** Multiple autonomous agents (Antigravity, Hermes, etc.) operate concurrently on this workspace. You MUST strictly adhere to the locking and deployment protocol:

1. **Check Status Before Any Task:**
   ```bash
   python scripts/agent-coord/coord.py status
   ```
2. **Acquire Lock Before Editing Code:**
   ```bash
   python scripts/agent-coord/coord.py claim --agent antigravity --task "<short task>" --scope "<files/folders>" [--ttl 90]
   ```
3. **The Canonical Protected Push Gate:**
   ALL code pushes MUST pass exclusively through the coordination guard:
   ```bash
   python scripts/agent-coord/coord.py guard --agent antigravity --push
   ```
   * The guard handles `fetch` + `pull --rebase` + `push` safely with automatic collision retry.
   * **Absolute Ban:** Direct `git push origin main` without coordination, and **`git push --force` is PERMANENTLY FORBIDDEN**.
4. **Release Lock After Completion:**
   ```bash
   python scripts/agent-coord/coord.py release --agent antigravity --commit <hash> --note "<summary>"
   ```
5. **No Blind Staging:** Always stage specific modified files explicitly (`git add path/to/file`). NEVER run `git add -A` or `git add .` without lock verification.

---

## 🧪 6. Verification Before Push
1. **Frontend / UI Changes:** Must be verified in the browser (Playwright or Chrome DevTools) with zero console errors and verified responsive layout (390px mobile + desktop) before committing.
2. **Backend / API Changes:** Must be verified via endpoint health checks or automated unit/integration tests (`200 OK`) before committing.
3. **Docs / Non-Code Changes:** Verify syntax, links, and markdown formatting, then push through `coord.py guard`.

---

## 📱 7. Mobile-First Single-Depth Surfaces (MOB-015)
1. **Ban Nested Cards (Box-in-Box):** On mobile (`< 640px`), sub-sections must blend into the parent surface with subtle hairline dividers (`border-t border-line`), not nested borders and cascading padding (`p-6`).
2. **85%+ Viewport Utilization:** On 390px (iPhone 14), actual content must occupy >= 85% of screen width.
3. **Horizontal Scroll for Dense Navigations:** Convert multi-button toolbars to compact horizontal scrolling rows (`overflow-x-auto scrollbar-none`).

---

## 🐝 8. Balanced Delegation & Multi-Agent Orchestration
1. **Complex / Multi-Domain Tasks:** Multi-file features spanning backend, frontend, security audits, and scenario verification should be partitioned across specialized subagents using `invoke_subagent` without polling loops.
2. **Atomic / Routine Tasks:** Execute directly and cleanly under Ponytail laws without spinning up redundant subagents for single-file edits.

---

## 📦 9. Desktop App Mandatory Version Bumping
Whenever any change or bug fix is made in `apps/desktop`, you MUST bump the `version` in `apps/desktop/package.json` (e.g. `1.0.4` → `1.0.5`) to satisfy `electron-updater` SemVer laws (`remoteVersion > localVersion`).
