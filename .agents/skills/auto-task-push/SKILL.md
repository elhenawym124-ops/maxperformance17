---
name: auto-task-push
description: Automatically commit and push updates to https://github.com/elhenawym124-ops/maxperformance17 with descriptive commit messages after completing any task.
---

# Auto Task Push Skill

This skill defines the mandatory post-task workflow for the MaxP platform workspace.

## Trigger

Automatically triggered upon completing **ANY** task, feature implementation, bug fix, refactoring, or rule/documentation update.

## Mandatory Prerequisite Gate (بوابة الجودة الإلزامية قبل الرفع)

> [!IMPORTANT]
> **NO PUSH WITHOUT LIVE PROOF (ممنوع الرفع بدون إثبات عملي)**:
> Before running any git commands in this skill, the agent MUST have strictly satisfied the `task-scenario-browser-verify` skill:
> 1. Formulated the pre-flight test scenario.
> 2. Implemented the task cleanly with zero blast-radius.
> 3. Opened the live browser (via `chrome-devtools` or dev environment), executed the test scenario hands-on, confirmed zero console errors (`list_console_messages`), and verified proper UI/API responses.
> *(For backend/script tasks without UI: executed a verifiable test script or API curl call confirming 200 OK).*
> **If this prerequisite is not met, executing Git Push is STRICTLY FORBIDDEN.**



- **Repository URL:** `https://github.com/elhenawym124-ops/maxperformance17`
- **Git Remote Name:** `origin`
- **Branch:** `main` (or current active branch)

## 🧭 Cross-Agent Coordination Gate (بوابة تنسيق الوكلاء — إلزامية قبل أي رفع)

> [!IMPORTANT]
> نفس الـ workspace يشتغل عليه أكثر من إيجينت (Antigravity + Hermes + غيرهم)، وأجهزة أخرى ترفع إلى `origin` في نفس الوقت. قبل أي `git commit` / `git push`:

0. لو التاسك لسه محصلش claim:
   ```bash
   node scripts/agent-coord/coord.cjs claim --agent <your-agent-name> --task "<ملخص التاسك>" --scope "<files>"
   ```
   - لو مرفوض → فيه إيجينت آخر شغال — **قف وابلغ المستخدم** (ممنوع العمل بالتوازي على نفس الشجرة).
   - للمهام الطويلة (>60 دقيقة): قم بتجديد القفل عبر `node scripts/agent-coord/coord.cjs heartbeat --agent <your-agent-name>`.
1. ارفع حصريًا عبر البوابة (fetch + pull --rebase + push مع إعادة محاولة تلقائية):
   ```bash
   node scripts/agent-coord/coord.cjs guard --agent <your-agent-name> --push
   ```
2. بعد نجاح الرفع، حرّر القفل وسجّل الإنجاز:
   ```bash
   node scripts/agent-coord/coord.cjs release --agent <your-agent-name> --commit <hash> --note "<ملخص>"
   ```
3. لو البوابة رفضت أو فشل الـ rebase → أوقف وابلغ المستخدم. **force push والرفع المباشر بدون guard ممنوعان نهائيًا**.

التفاصيل الكاملة: `docs/agent-coordination.md` — الحالة: `~/.agent-coordination/`.

## Protocol & Steps

1. **Review Changed Files:**
   Check modified and untracked files:
   ```bash
   git status
   ```

2. **Stage Changes:**
   Stage relevant changed files, preserving `.gitignore` exclusions:
   ```bash
   git add <modified-and-new-files>
   ```

3. **Craft Descriptive Commit Message:**
   Write a descriptive commit message that clearly states what was accomplished in the completed task:
   - Example: `feat(mindmap): add execution node validation and state machine`
   - Example: `fix(auth): resolve JWT token expiration refresh race condition`
   - Example: `docs(skill): add auto-task-push skill for automatic post-task commits`

   ```bash
   git commit -m "<descriptive message identifying the task changes>"
   ```

4. **Push to Remote (عبر بوابة التنسيق الحصرية):**
   Push commits exclusively through the coordination guard (fetch + pull --rebase + push بأمان):
   ```bash
   node scripts/agent-coord/coord.cjs guard --agent <your-agent-name> --push
   ```

   > [!CAUTION]
   > ## 🚫 ABSOLUTE BAN: Direct `git push` & `git push --force`
   > **NEVER use direct git push or force push under ANY circumstances. All pushes must pass through `coord.cjs guard`.**
   > - `git push origin main` (direct push) → **BANNED**
   > - `git push --force` → **BANNED**
   > - `git push --force-with-lease` → **BANNED**
   > - `git push -f` → **BANNED**
   >
   > Direct pushing bypasses coordination locks and corrupts concurrent agent workflows. Force pushing destroys teammates' work.
   > The guard automatically executes `git pull --rebase` and safe push.
   > If the guard rejects the push, **STOP and ask the user first.**

5. **Report to User:**
   Provide the commit message, commit hash, and confirmation that updates were pushed to `https://github.com/elhenawym124-ops/maxperformance17`.
