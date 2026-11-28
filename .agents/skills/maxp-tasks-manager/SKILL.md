---
name: maxp-tasks-manager
description: Manage, execute, discuss, and track personal and team tasks on the MaxP platform via the Tasks External REST API (https://maxp.online/api/v1/external/tasks). Includes key validation, task listing, status progression, and automated task execution.
---

# MaxP Tasks Manager Skill

This skill enables Antigravity and workspace agents to interact seamlessly with the MaxP Tasks API (`/api/v1/external/tasks`), inspect assigned tasks, collaborate with the user on task breakdown, update progress, and mark tasks completed upon verified implementation.

## Overview & Architecture

- **Base URL:** `https://maxp.online/api/v1/external/tasks`
- **Authentication:** `x-api-key: <tsk_publicPart_secretPart>` (or `Authorization: Bearer <token>`)
- **Required Scopes:**
  - `tasks:read` (List tasks, get details, view projects/users/goals)
  - `tasks:write` (Create tasks, update fields, advance progress)
  - `tasks:update` (Update task status)
- **Local Helper Tool:** `.agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs`
- **Key Storage:** `.agents/skills/maxp-tasks-manager/.key.json` (gitignored via SEC-TASKS-KEY-1 — never commit; tenant-isolated)

---

## CLI Commands Reference

All commands are run using Node.js:

```bash
# 1. Test an API Key
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs test-key <api_key>

# 2. Save and activate an API Key
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs save-key <api_key>

# 3. List active tasks
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs list --limit=10 --status=PENDING

# 4. Filter by priority or search term
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs list --priority=HIGH --search="fix"

# 5. Get full task details including criteria and attachments
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs get <task_id>

# 6. Update task status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD, IN_REVIEW)
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs update-status <task_id> IN_PROGRESS
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs update-status <task_id> COMPLETED

# 7. Update progress or description
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs update <task_id> '{"progress": 75, "description": "..."}'

# 8. List linked goals and projects
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs projects
node .agents/skills/maxp-tasks-manager/scripts/tasks_client.cjs goals
```

---

## Task Execution Workflow

When executing user tasks:
1. **Fetch & Triage:** Fetch tasks sorted by priority (`URGENT` -> `HIGH` -> `MEDIUM` -> `LOW`) or pending status.
2. **Present to User:** Show the first batch (e.g. 5 tasks) in a clean tabular view:
   - Task ID & Title
   - Priority & Due Date
   - Description & Acceptance Criteria
   - Proposed Action Plan
3. **Discussion & Alignment:** Align with the user on implementation details before writing code.
4. **Implementation & Zero Blast-Radius:** Implement each task following project rules (`strict-change-isolation`, modular components < 400 lines).
5. **Live Verification & Proof:** Verify using the test scenario / browser before advancing task status to `COMPLETED`.
6. **Status Sync:** Update status via the API: `update-status <task_id> COMPLETED`.
