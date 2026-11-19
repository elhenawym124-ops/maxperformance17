# MaxP Platform — Project Agent Rules

> **Canonical Master Directive:** This file is synchronized with `AGENTS.md` at workspace root. Refer to `AGENTS.md` for full constitutional guidance.

---

## ⚡ 1. Default Execution Mode: Automatic Ponytail + Caveman
1. **Automatic Ponytail (Zero Code Bloat):** Always implement the leanest, smallest possible change that fully and robustly solves the task. Ban speculative abstractions, unnecessary wrapper classes, and superfluous dependencies.
2. **Automatic Caveman (Zero Conversational Fluff):** Deliver answers and code first. Strip pleasantries, narrations of routine steps, recaps, and conversational padding. Keep all technical facts, code, diffs, and exact error strings verbatim.
3. **Zero UI Copy Bloat (Show, Don't Tell):** UI controls must be self-evident. Never inject explanatory subtitles, instructional paragraphs, or marketing fluff under headers, cards, or buttons.

---

## 🎨 2. MaxP Official Design System: The Petrol & Persimmon Standard
1. **Signature Palette:** Deep Petrol (`#013735`), Warm Persimmon (`#e2603f`), Natural Paper (`#f4f6f5`), White Surface (`#ffffff`), Hairline Zinc (`#d8e2df`). Dark Mode: Deep Graphite Teal (`#081110`, `#0e1a19`, `#3ec8b7`, `#ff8a68`).
2. **Typography:** `IBM Plex Sans Arabic` for Arabic UI copy; `IBM Plex Mono` with `tabular-nums` for numeric telemetry, currency, codes, and paths. Ban `font-mono` on Arabic text.
3. **Linear-Caliber Clarification:** Linear caliber means hairline borders (`border-border/70`), spring micro-haptics (`:active scale(0.97)`), and keyboard shortcuts (`⌘K`), NOT dark developer terminal themes.
4. **Hub & Drawer Architecture:** Group multi-tool cockpits and launchers into 5 clean operational Hubs with smooth CSS grid drawer unfolding or clean grouped sections.
5. **The 12 Banned Slop Flags:** Zero emoji littering (`🤖🚀⚡`), ban purple dark mesh, ban symmetrical card clones, ban marketing fluff, ban glassmorphism spam, ban glowing borders, ban floating islands, ban stock 3D avatars, ban centered hero trap, ban dead badges, ban developer jargon on merchant pages, and ban meta-explanatory UI clutter.

---

## 🛡️ 3. Strict Change Isolation (Zero Blast-Radius) & Safe Evolution
1. **Mandatory Pre-Edit Audit (`grep`):** Verify all references before modifying shared components.
2. **Specialize Over Mutating Shared Core:** Use page-scoped wrappers or additive optional props; never break existing shared defaults.
3. **No Legacy Flaw Cloning:** Strict isolation prevents regressions on existing screens; it **DOES NOT** mean copying outdated 2018 templates or bad design patterns when creating **NEW** pages.
4. **Dedicated Route & State Isolation:** Keep screens modular (< 300–400 lines per file) with localized state and Error Boundaries.

---

## 🔐 4. Zero Secrets in Filesystem (Mandatory Database Storage in `public.ai_keys`)
1. **Ban AI API Keys in `.env`:** NEVER store or read AI API keys from `.env` files.
2. **Mandatory PostgreSQL Storage:** All AI keys MUST be resolved dynamically from `public.ai_keys` (`WHERE isActive = true ORDER BY priority ASC`), scoped by tenant (`companyId`) or platform-wide (`CENTRAL`).

---

## 🔗 5. Cross-Agent Coordination & The Protected Git Push Gate
1. **Status Check:** `python scripts/agent-coord/coord.py status`
2. **Acquire Lock:** `python scripts/agent-coord/coord.py claim --agent antigravity --task "<short task>" --scope "<files>"`
3. **The Canonical Push Gate:** All pushes MUST pass exclusively through:
   ```bash
   python scripts/agent-coord/coord.py guard --agent antigravity --push
   ```
   Direct `git push origin main` and `git push --force` are PERMANENTLY FORBIDDEN.
4. **Release Lock:** `python scripts/agent-coord/coord.py release --agent antigravity --commit <hash> --note "<summary>"`
5. **No Blind Staging:** Explicit file staging only (`git add <file>`). Ban `git add -A` and `git add .`.

---

## 🧪 6. Verification Before Push
1. **Frontend / UI:** Live browser verification (zero console errors, verified mobile/desktop responsive).
2. **Backend / API:** Test suite or live health check verification (`200 OK`).
3. **Docs / Non-Code:** Format and link verification, then push through `coord.py guard`.

---

## 📱 7. Mobile-First Single-Depth Surfaces (MOB-015)
1. **Ban Box-in-Box:** On mobile (`< 640px`), sub-sections blend with hairline dividers (`border-t border-line`), not nested cards and heavy padding.
2. **85%+ Viewport Utilization:** Content must occupy >= 85% of screen width on 390px viewports.
3. **Horizontal Scroll:** Convert dense multi-button rows to horizontal scrolling rows.

---

## 🐝 8. Balanced Multi-Agent Delegation
Partition complex, multi-domain features across specialized subagents via `invoke_subagent`. Execute atomic/routine tasks directly under Ponytail laws.

---

## 📦 9. Desktop App Mandatory Version Bumping
Whenever any change is made in `apps/desktop`, bump the `version` in `apps/desktop/package.json` (`remoteVersion > localVersion`).
