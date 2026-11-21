#!/usr/bin/env node
/**
 * MaxP Tasks — automation cycle helper.
 *
 * Read:  sync | next | digest
 * Write: claim <id> | note <id> | review <id> | hold <id>
 *
 * Design rules baked in:
 *  - one task per cycle, never auto-COMPLETED (human gate = IN_REVIEW)
 *  - dependencies must be COMPLETED before a task is eligible
 *  - human-only work (calls, shipping, customers) is never claimed automatically
 *  - a browser-like User-Agent is mandatory or Cloudflare answers 502
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE_URL = (process.env.MAXP_TASKS_API_URL || 'https://maxp.online/api/v1/external/tasks').replace(/\/+$/, '');
const UA = process.env.MAXP_TASKS_UA
  || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const HOME = os.homedir();
const SECRETS = [path.join(HOME, '.hermes', 'secrets', 'maxp-tasks.json'), path.join(__dirname, '..', '.key.json')];
const STATE_DIR = process.env.MAXP_TASKS_STATE_DIR || path.join(HOME, '.hermes', 'cache', 'maxp-tasks');
const SNAPSHOT = path.join(STATE_DIR, 'snapshot.json');

const PRIORITY = { URGENT: 40, HIGH: 25, MEDIUM: 10, LOW: 3 };
const OPEN = new Set(['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'ON_HOLD']);

const AGENT_RE = /فحص|مراجعة|تقرير|اختبار|إصلاح|كود|API|تحليل|بحث|إثبات|تدقيق|توثيق|سكربت|أتمتة|اتمتة|بيانات|SQL|PR\b|TypeScript|backend|frontend/i;
const HUMAN_RE = /مكالمة|اتصال|واتساب|عميل(ة)?|أوردر|اوردر|شحن|مندوب|تحصيل|تسليم|تليفون|فيديو|تصوير|مونتاج/;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_e) { return null; }
}

function apiKey() {
  if (process.env.MAXP_TASKS_API_KEY) return process.env.MAXP_TASKS_API_KEY.trim();
  for (const f of SECRETS) {
    const d = readJson(f);
    if (d?.apiKey) return String(d.apiKey).trim();
  }
  throw new Error('No API key. Run: node tasks_client.cjs save-key <key>');
}

function baseUrl() {
  for (const f of SECRETS) {
    const d = readJson(f);
    if (d?.baseUrl) return String(d.baseUrl).replace(/\/+$/, '');
  }
  return BASE_URL;
}

async function api(pathname = '', opts = {}) {
  const url = `${baseUrl()}${pathname}`;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: opts.method || 'GET',
        headers: {
          'x-api-key': apiKey(),
          'User-Agent': UA,
          Accept: 'application/json',
          ...(opts.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
        },
        body: opts.body,
        signal: AbortSignal.timeout(60000),
      });
      const text = await res.text();
      let json;
      try { json = text ? JSON.parse(text) : {}; } catch (_e) { json = { raw: text.slice(0, 300) }; }
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      return { status: res.status, ok: res.ok, json };
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastErr;
}

async function fetchAll() {
  const tasks = [];
  let page = 1;
  let pages = 1;
  do {
    const res = await api(`?page=${page}&limit=100`);
    if (!res.ok || !res.json?.success) throw new Error(`GET list ${res.status}: ${res.json?.message || ''}`);
    tasks.push(...(res.json.data || []));
    pages = res.json.pagination?.totalPages || 1;
    page += 1;
  } while (page <= pages);
  return tasks;
}

function fmtDay(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : '—';
}

function daysAgo(d) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function classify(t) {
  const s = `${t.title || ''} ${t.description || ''}`;
  const human = HUMAN_RE.test(s);
  const agent = AGENT_RE.test(s);
  if (human && agent) return 'mixed';
  if (human) return 'human';
  if (agent) return 'agent';
  return 'mixed';
}

function unresolvedDeps(t, byId) {
  return (t.dependencies || []).filter((id) => {
    const d = byId.get(id);
    return !d || d.status !== 'COMPLETED';
  });
}

function eligible(t, byId) {
  if (!OPEN.has(t.status)) return false;
  if (t.status === 'ON_HOLD') return false;
  return unresolvedDeps(t, byId).length === 0;
}

function score(t, cls) {
  let s = PRIORITY[t.priority] || 0;
  const late = daysAgo(t.dueDate) || 0;
  s += Math.min(Math.max(late, 0), 30) * 1.5;
  s += Math.min(daysAgo(t.createdAt) || 0, 60) * 0.2;
  if (cls === 'agent') s += 12;
  if (cls === 'human') s -= 8;
  if ((t.tags || []).some((x) => ['ايجنت', 'AI', 'hermes'].includes(String(x).toLowerCase()))) s += 15;
  return Math.round(s * 10) / 10;
}

function buildQueue(tasks, { tag, assignee, onlyAgent = true, includeActive = false, limit = 8 } = {}) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const rows = [];
  for (const t of tasks) {
    if (!eligible(t, byId)) continue;
    if (!includeActive && t.status !== 'PENDING') continue;
    if (assignee && t.assignedTo !== assignee) continue;
    if (tag && !(t.tags || []).some((x) => String(x).toLowerCase() === String(tag).toLowerCase())) continue;
    const cls = classify(t);
    if (onlyAgent && cls === 'human') continue;
    rows.push({ t, cls, s: score(t, cls) });
  }
  return rows.sort((a, b) => b.s - a.s).slice(0, limit);
}

function jobsSync(tasks, { quiet = false } = {}) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const prev = readJson(SNAPSHOT);
  const prevById = new Map((prev?.tasks || []).map((t) => [t.id, t]));
  const seen = new Set();
  const changes = { created: [], status: [], edited: [] };

  for (const t of tasks) {
    seen.add(t.id);
    const old = prevById.get(t.id);
    if (!old) changes.created.push(t);
    else if (old.status !== t.status) changes.status.push({ id: t.id, from: old.status, to: t.status, title: t.title });
    else if (old.updatedAt !== t.updatedAt) changes.edited.push(t);
  }

  const snap = { syncedAt: new Date().toISOString(), count: tasks.length, tasks, changes, baseline: !prev };
  fs.writeFileSync(SNAPSHOT, JSON.stringify(snap), 'utf8');
  if (!quiet) {
    const by = tasks.reduce((a, t) => ({ ...a, [t.status]: (a[t.status] || 0) + 1 }), {});
    console.log(`✅ ${tasks.length} tasks · ${Object.entries(by).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
    console.log(`   snapshot: ${SNAPSHOT}`);
    if (prev) console.log(`   delta: +${changes.created.length} جديد · ${changes.status.length} حالة · ${changes.edited.length} تعديل`);
    else console.log('   baseline saved');
  }
  return snap;
}

function loadOrSync() {
  const snap = readJson(SNAPSHOT);
  if (snap && (Date.now() - new Date(snap.syncedAt).getTime()) / 60000 < 15) return snap;
  return null;
}

function printQueue(rows) {
  if (!rows.length) return console.log('لا توجد مهام مؤهلة.');
  console.log('score  prio    late  deps  class  title');
  for (const { t, cls, s } of rows) {
    const late = t.dueDate ? daysAgo(t.dueDate) : null;
    const lateTxt = late > 0 ? `${late}d` : '—';
    console.log(`${String(s).padStart(5)}  ${(t.priority || '').padEnd(6)}  ${lateTxt.padStart(4)}  ${String((t.dependencies || []).length || '—').padStart(4)}  ${cls.padEnd(6)} ${(t.title || '').replace(/\s+/g, ' ').slice(0, 64)}`);
    console.log(`       id=${t.id} · ${t.assignedToName || '—'}`);
  }
}

async function cmdNext(flags) {
  const snap = loadOrSync() || jobsSync(await fetchAll(), { quiet: true });
  const rows = buildQueue(snap.tasks, {
    tag: typeof flags.tag === 'string' ? flags.tag : undefined,
    assignee: typeof flags.assignee === 'string' ? flags.assignee : undefined,
    onlyAgent: !flags.all,
    includeActive: Boolean(flags.active),
    limit: Number(flags.limit || 8),
  });
  console.log(`snapshot ${snap.syncedAt} · ${snap.count} tasks\n`);
  printQueue(rows);
}

function cmdDigest(flags) {
  const snap = loadOrSync();
  if (!snap) throw new Error('no fresh snapshot — run: node task_cycle.cjs sync');
  const T = snap.tasks;
  const open = T.filter((t) => OPEN.has(t.status));
  const overdue = open.filter((t) => t.dueDate && daysAgo(t.dueDate) > 0);
  const pending = open.filter((t) => t.status === 'PENDING');
  const queue = buildQueue(T, {
    limit: Number(flags.limit || 6),
    assignee: typeof flags.assignee === 'string' ? flags.assignee : undefined,
    tag: typeof flags.tag === 'string' ? flags.tag : undefined,
    includeActive: true,
  });
  const review = open.filter((t) => t.status === 'IN_REVIEW');
  const byId = new Map(T.map((t) => [t.id, t]));
  const blocked = open.filter((t) => unresolvedDeps(t, byId).length > 0);

  const owners = {};
  for (const t of open) owners[t.assignedToName || '—'] = (owners[t.assignedToName || '—'] || 0) + 1;

  console.log(`## دورة MaxP — ${new Date().toISOString().slice(0, 10)}\n`);
  console.log(`- إجمالي: **${T.length}** · مفتوح: **${open.length}** · متأخر: **${overdue.length}** · PENDING: **${pending.length}**`);
  if (snap.baseline) {
    console.log('- أول مزامنة (خط أساس) — لا توجد فروق بعد\n');
  } else {
    console.log(`- جديدة منذ آخر مزامنة: **${snap.changes?.created?.length || 0}** · تغيّرت حالتها: **${snap.changes?.status?.length || 0}**\n`);
  }
  console.log(`- محجوبة بتبعيات: **${blocked.length}** · في المراجعة: **${review.length}**\n`);

  console.log(`### أول ${queue.length} مهام قابلة للتنفيذ`);
  if (!queue.length) console.log('_لا شيء مؤهل._');
  for (const [i, r] of queue.entries()) {
    const late = r.t.dueDate ? daysAgo(r.t.dueDate) : null;
    console.log(`${i + 1}. **${r.t.title}** — ${r.t.priority}${late > 0 ? ` · متأخرة ${late} يوم` : ''} · ${r.t.assignedToName || '—'} · \`${r.t.id}\``);
  }

  console.log('\n### الحِمل على الفريق');
  for (const [n, c] of Object.entries(owners).sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`- ${n}: ${c}`);

  const oldest = review.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)).slice(0, 3);
  if (oldest.length) {
    console.log('\n### أقدم ما ينتظر مراجعة');
    for (const t of oldest) console.log(`- ${t.title.slice(0, 60)} — ${daysAgo(t.updatedAt)} يوم · \`${t.id}\``);
  }
}

async function getTask(id) {
  const res = await api(`/${id}`);
  if (!res.ok || !res.json?.success) throw new Error(`GET ${id} ${res.status}: ${res.json?.message || ''}`);
  return res.json.data;
}

async function patch(id, body) {
  const res = await api(`/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  if (!res.ok || !res.json?.success) throw new Error(`PATCH ${id} ${res.status}: ${res.json?.message || ''}`);
  return res.json.data;
}

async function setStatus(id, status, progress) {
  const body = { status };
  if (typeof progress === 'number') body.progress = progress;
  const res = await api(`/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) });
  if (!res.ok || !res.json?.success) throw new Error(`PATCH ${id}/status ${res.status}: ${res.json?.message || ''}`);
  return res.json.data;
}

function append(existing, text) {
  return `${(existing || '').trimEnd()}\n\n---\n### 🤖 Hermes — ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC\n${text.trim()}\n`;
}

async function cmdClaim(id, flags) {
  const t = await getTask(id);
  const cls = classify(t);
  if (cls === 'human' && !flags.force) throw new Error('المهمة بشرية (مكالمة/شحن/عميل). استخدم --force لو مصرّ.');
  const tags = [...new Set([...(t.tags || []), String(flags.tag || 'hermes:working')])];
  if (flags.dry) return console.log('DRY-RUN claim', id, { tags, assignedTo: flags.assignee });
  await patch(id, { tags, ...(flags.assignee ? { assignedTo: String(flags.assignee) } : {}) });
  const out = await setStatus(id, 'IN_PROGRESS', Number(flags.progress ?? 5));
  console.log(`✅ claimed ${id} → ${out.status} ${out.progress}% · ${out.assignedToName}`);
}

function readFlagFile(flags) {
  if (flags.file && flags.file !== true) {
    let p = String(flags.file);
    // git-bash passes /c/Users/... but node is a native binary
    if (/^\/[a-zA-Z]\//.test(p)) p = `${p[1].toUpperCase()}:/${p.slice(3)}`;
    return fs.readFileSync(p, 'utf8');
  }
  return null;
}

async function cmdNote(id, flags) {
  const text = flags.text && flags.text !== true ? flags.text : readFlagFile(flags);
  if (!text) throw new Error('note needs --text "..." or --file path');
  const t = await getTask(id);
  const out = await patch(id, { description: append(t.description, text) });
  console.log(`✅ note → ${out.id} (${out.description.length} chars)`);
}

async function cmdReview(id, flags) {
  const t = await getTask(id);
  const text = (flags.text && flags.text !== true ? flags.text : readFlagFile(flags)) || 'تم التنفيذ والتحقق. جاهزة للمراجعة.';
  if (flags.dry) return console.log('DRY-RUN review', id);
  await patch(id, { description: append(t.description, text) });
  const out = await setStatus(id, 'IN_REVIEW', Number(flags.progress ?? 90));
  console.log(`✅ ${out.id} → ${out.status} ${out.progress}%`);
}

async function cmdHold(id, flags) {
  const t = await getTask(id);
  await patch(id, { description: append(t.description, `⏸️ ${flags.text || 'متوقفة مؤقتًا.'}`) });
  const out = await setStatus(id, 'ON_HOLD');
  console.log(`✅ ${out.id} → ${out.status}`);
}

function parse(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, ...v] = a.slice(2).split('=');
      if (v.length) {
        flags[k] = v.join('=');
      } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        flags[k] = argv[i + 1];
        i += 1;
      } else {
        flags[k] = true;
      }
    } else {
      pos.push(a);
    }
  }
  return { pos, flags };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, flags } = parse(rest);
  switch (cmd) {
    case 'sync': return jobsSync(await fetchAll());
    case 'next': return cmdNext(flags);
    case 'digest': return cmdDigest(flags);
    case 'claim': return cmdClaim(pos[0], flags);
    case 'note': return cmdNote(pos[0], flags);
    case 'review': return cmdReview(pos[0], flags);
    case 'hold': return cmdHold(pos[0], flags);
    default:
      console.log(`MaxP cycle helper
  node task_cycle.cjs sync
  node task_cycle.cjs next [--tag=hermes] [--assignee=ID] [--all] [--active] [--limit=8]
  node task_cycle.cjs digest [--limit=6]
  node task_cycle.cjs claim <id> [--assignee=ID] [--tag=hermes:working] [--dry]
  node task_cycle.cjs note <id> --text "..." | --file path
  node task_cycle.cjs review <id> [--text "..."] [--file path]
  node task_cycle.cjs hold <id> --text "reason"`);
  }
}

main().catch((e) => { console.error('❌', e.message || e); process.exit(1); });
