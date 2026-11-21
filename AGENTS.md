# AGENTS.md — MaxP Platform Master Workspace Laws

> **Master Constitution:** Single source of truth for all autonomous and collaborative sessions across MaxP. Every rule here is mandatory and non-negotiable.

---

## ⚡ 1. Default Execution Mode: Automatic Ponytail + Caveman
1. **Automatic Ponytail (Zero Bloat):** Implement the leanest, smallest possible change that fully solves the task. Ban speculative abstractions, unnecessary wrapper classes, and superfluous dependencies.
2. **Automatic Caveman (Zero Fluff):** Deliver answers and code first. Strip pleasantries, narrations of routine steps, recaps, and conversational padding. Keep technical facts, code, diffs, and exact error strings verbatim.
3. **Zero UI Copy Bloat (Show, Don't Tell):** UI controls must be self-evident. Never inject explanatory subtitles, instructional paragraphs, or marketing fluff under headers, cards, or buttons.

---

## 🎨 2. MaxP Design System: The Petrol & Persimmon Law
> **Domain Standard:** MaxP is an Arabic-first Enterprise Commerce & Business Operations OS — NOT a developer terminal or IDE console.

1. **Tokens Over Raw Values:** The single source of truth for design tokens lives in the codebase (`apps/frontend/src/styles/` & Tailwind config). All UI must use platform tokens (`bg-card`, `text-foreground`, `border-border/70`, `bg-petrol`, `text-accent`). **Raw hex strings (e.g. `#013735`) in component files are strictly banned.**
2. **Typography Law:** `IBM Plex Sans Arabic` for Arabic UI copy; `IBM Plex Mono` with `tabular-nums` for numeric telemetry, currency, codes, and paths. Never apply monospace (`font-mono`) to Arabic text.
3. **RTL & Logical Properties First:** Mandatory logical properties (`ms-`, `me-`, `ps-`, `pe-`, `border-inline-*`). Hardcoded directional utilities (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`) are forbidden.
4. **Linear-Caliber Clarification:** Linear caliber strictly means **hairline borders (`border-border/70`), spring micro-haptics (`:active scale(0.97)`), and keyboard shortcuts (`⌘K`)** — it DOES NOT mean copying dark developer terminal themes on merchant or business screens.
5. **Single-Surface Chassis:** Workspaces and dashboards must be a single continuous surface separated by clean hairline dividers, banning floating islands separated by wide grey gaps.
6. **The 12 Banned AI Slop Flags:** Zero emoji littering in titles (`🤖🚀⚡`), ban purple/cyan dark mesh, ban cookie-cutter card clones, ban marketing fluff, ban glassmorphism spam, ban fake glowing borders, ban floating islands, ban stock 3D avatars, ban centered hero trap, ban dead unclickable badges, ban developer jargon on merchant pages, and ban meta-explanatory clutter in production UI.
7. **Polaris Track Exception:** Merchant surfaces scoped under the Shopify Polaris Track (`taste-skill` Section 16 + `polaris-track.css`) render grey canvas + floating white surface cards **by design**. Rules 5 & 6's floating-island bans are lifted ONLY on those scoped pages. Tokens law (1), Typography (2), RTL (3), and MOB-015 still apply unchanged.

---

## 🛡️ 3. Strict Change Isolation (Zero Blast-Radius) & Safe Evolution
1. **Mandatory Pre-Edit Audit (`grep`):** Verify all references across the codebase before modifying any shared component, hook, or API endpoint.
2. **Specialize Over Mutating Shared Core:** Use page-scoped wrappers or additive optional props; never mutate shared defaults in ways that break existing screens.
3. **No Legacy Flaw Cloning:** Strict isolation prevents regressions on existing screens; it **DOES NOT** mean copying outdated 2018 templates or bad design patterns when creating **NEW** pages.
4. **Dedicated Route & State Isolation:** Keep screens modular (< 300–400 lines per file) with localized state and Error Boundaries.

---

## 🔐 4. Zero Secrets in Filesystem (Mandatory Database Storage in `public.ai_keys`)
1. **Ban AI API Keys in `.env`:** NEVER store, hardcode, or read AI API keys from `.env` or configuration files.
2. **Mandatory PostgreSQL Storage:** All AI keys MUST be resolved dynamically from `public.ai_keys` (`WHERE isActive = true ORDER BY priority ASC`), scoped by tenant (`companyId`) or platform-wide (`CENTRAL`).

---

## 🔗 5. Cross-Agent Coordination & The Protected Git Push Gate
> **Multi-Agent Workspace Law:** Multiple autonomous agents (Antigravity, Hermes, ZCode, etc.) operate concurrently on this workspace. You MUST strictly adhere to the locking and deployment protocol via `node scripts/agent-coord/coord.cjs` (or `coord.py`):

1. **Identity:** Use YOUR OWN registered agent name (`--agent <your-name>`). Never claim or guard under another agent's identity.
2. **Check Status Before Any Task:** `node scripts/agent-coord/coord.cjs status`
3. **Acquire Lock Before Editing Code:** `node scripts/agent-coord/coord.cjs claim --agent <your-name> --task "<short task>" --scope "<files>"`
4. **Heartbeat for Long Tasks:** Renew lock periodically for tasks exceeding 60 minutes: `node scripts/agent-coord/coord.cjs heartbeat --agent <your-name>`
5. **The Canonical Push Gate:** All pushes MUST pass exclusively through the coordination guard:
   ```bash
   node scripts/agent-coord/coord.cjs guard --agent <your-name> --push
   ```
   Direct `git push origin main` and `git push --force` are PERMANENTLY FORBIDDEN.
6. **Release Lock After Completion:** `node scripts/agent-coord/coord.cjs release --agent <your-name> --commit <hash> --note "<summary>"`
7. **No Blind Staging:** Explicit file staging only (`git add <file>`). NEVER run `git add -A` or `git add .` without lock verification.

---

## 🧪 6. Verification Before Push
1. **Frontend / UI Changes:** Must be verified in the browser (Playwright or Chrome DevTools) with zero console errors and verified responsive layout (390px mobile + desktop) before committing.
2. **Backend / API Changes:** Must be verified via endpoint health checks or automated unit/integration tests (`200 OK`) before committing.
3. **Docs / Non-Code Changes:** Verify syntax, links, and markdown formatting, then push through `coord.cjs guard`.

---

## 📱 7. Mobile-First Single-Depth Surfaces (MOB-015)
1. **Ban Box-in-Box:** On mobile (`< 640px`), sub-sections must blend into the parent surface with subtle hairline dividers (`border-t border-line`), not nested borders and cascading padding (`p-6`).
2. **85%+ Viewport Utilization:** On 390px (iPhone 14), actual content must occupy >= 85% of screen width.
3. **Horizontal Scroll:** Convert multi-button toolbars to compact horizontal scrolling rows (`overflow-x-auto scrollbar-none`).

---

## 🐝 8. Balanced Delegation & Multi-Agent Orchestration
1. **Complex / Multi-Domain Tasks:** Partition multi-file features spanning backend, frontend, security audits, and scenario verification across specialized subagents using `invoke_subagent` without polling loops.
2. **Atomic / Routine Tasks:** Execute directly and cleanly under Ponytail laws without spinning up redundant subagents for single-file edits.

---

## 📦 9. Desktop App Mandatory Version Bumping
Whenever any change or bug fix is made in `apps/desktop`, you MUST bump the `version` in `apps/desktop/package.json` (e.g. `1.0.4` → `1.0.5`) to satisfy `electron-updater` SemVer laws (`remoteVersion > localVersion`).
