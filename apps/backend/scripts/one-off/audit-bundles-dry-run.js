#!/usr/bin/env node
'use strict';

/**
 * audit-bundles-dry-run.js — Task 621f2800 / Task 2f9d3804
 *
 * يعرض حالة نظام الباقات قبل أي تنضيف. **لا بيكتب ولا بيحذف أي حاجة.**
 *
 * التشغيل (dry-run افتراضي، القراءة فقط):
 *   node apps/backend/scripts/one-off/audit-bundles-dry-run.js
 *   node apps/backend/scripts/one-off/audit-bundles-dry-run.js --json
 *   node apps/backend/scripts/one-off/audit-bundles-dry-run.js --ndjson
 *
 * خيارات المهلة والتدفق:
 *   --timeout-ms=30000        مهلة إجمالية للسكربت بالكامل (افتراضي 30000ms)
 *   --query-timeout-ms=10000  مهلة الاستعلام الواحد + statement_timeout (افتراضي 10000ms)
 *   --lock-timeout-ms=3000    مهلة انتظار الأقفال lock_timeout (افتراضي 3000ms)
 *   --connect-timeout-ms=10000 مهلة فتح الاتصال بقاعدة البيانات (افتراضي 10000ms)
 *   --connection-limit=3      حد اتصالات Prisma (افتراضي 2 للمباشر، 3 لـ PgBouncer)
 *   --quiet                   إخفاء سطور التقدّم على stderr في وضع --json
 *
 * ملاحظة معمارية:
 *   السكربت بيتصل بـ PrismaClient خفيف مباشرة بدل sharedDatabase.js
 *   لتجنب فتح socket لـ Redis (ioredis) أو pool كبير عبر PgBouncer أو تلويث stdout،
 *   وبيقفل الاتصال صراحةً في finally وبيخرج فورًا (process.exit) بعد انتهاء الاستعلامات.
 *
 * أي فشل في أي استعلام أو انتهاء مهلة = خروج بكود 1 مع رسالة واضحة (fail-closed).
 */

// 🛡️ حماية من التعليق على process.stdin عند التشغيل بدون tty أو مع </dev/null
if (process.stdin && typeof process.stdin.pause === 'function') {
  try {
    process.stdin.pause();
    if (typeof process.stdin.unref === 'function') {
      process.stdin.unref();
    }
  } catch (_) {}
}

const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '../..');

try {
  require('dotenv').config({ path: path.join(BACKEND_ROOT, '.env'), quiet: true });
} catch (_) {}

const { computeBundleSafety } = require(path.join(BACKEND_ROOT, 'services/bundleCleanupSafety'));

const DEFAULT_OPTIONS = {
  json: false,
  ndjson: false,
  quiet: false,
  connectTimeoutMs: 10000,
  lockTimeoutMs: 3000,
  queryTimeoutMs: 10000,
  totalTimeoutMs: 30000,
};

function parsePositiveInt(rawValue, flagName) {
  const num = Number(rawValue);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`قيمة غير صالحة لـ ${flagName}: ${rawValue} (مطلوب رقم صحيح موجب بالمللي ثانية)`);
  }
  return num;
}

function parseOptions(argv = [], env = process.env) {
  const options = {
    json: false,
    ndjson: false,
    quiet: false,
    help: false,
    connectTimeoutMs: env.AUDIT_CONNECT_TIMEOUT_MS
      ? parsePositiveInt(env.AUDIT_CONNECT_TIMEOUT_MS, 'AUDIT_CONNECT_TIMEOUT_MS')
      : DEFAULT_OPTIONS.connectTimeoutMs,
    lockTimeoutMs: env.AUDIT_LOCK_TIMEOUT_MS
      ? parsePositiveInt(env.AUDIT_LOCK_TIMEOUT_MS, 'AUDIT_LOCK_TIMEOUT_MS')
      : DEFAULT_OPTIONS.lockTimeoutMs,
    queryTimeoutMs: env.AUDIT_QUERY_TIMEOUT_MS
      ? parsePositiveInt(env.AUDIT_QUERY_TIMEOUT_MS, 'AUDIT_QUERY_TIMEOUT_MS')
      : DEFAULT_OPTIONS.queryTimeoutMs,
    totalTimeoutMs: env.AUDIT_TIMEOUT_MS
      ? parsePositiveInt(env.AUDIT_TIMEOUT_MS, 'AUDIT_TIMEOUT_MS')
      : DEFAULT_OPTIONS.totalTimeoutMs,
  };

  if (env.AUDIT_CONNECTION_LIMIT) {
    options.connectionLimit = parsePositiveInt(env.AUDIT_CONNECTION_LIMIT, 'AUDIT_CONNECTION_LIMIT');
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--ndjson') {
      options.ndjson = true;
      continue;
    }
    if (arg === '--quiet') {
      options.quiet = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    const readFlagValue = (prefix) => {
      if (arg.startsWith(`${prefix}=`)) {
        return arg.slice(prefix.length + 1);
      }
      if (arg === prefix) {
        const next = argv[i + 1];
        if (next === undefined) {
          throw new Error(`ناقص قيمة للخيار ${prefix}`);
        }
        i += 1;
        return next;
      }
      return null;
    };

    const totalVal = readFlagValue('--timeout-ms');
    if (totalVal !== null) {
      options.totalTimeoutMs = parsePositiveInt(totalVal, '--timeout-ms');
      continue;
    }
    const queryVal = readFlagValue('--query-timeout-ms');
    if (queryVal !== null) {
      options.queryTimeoutMs = parsePositiveInt(queryVal, '--query-timeout-ms');
      continue;
    }
    const lockVal = readFlagValue('--lock-timeout-ms');
    if (lockVal !== null) {
      options.lockTimeoutMs = parsePositiveInt(lockVal, '--lock-timeout-ms');
      continue;
    }
    const connVal = readFlagValue('--connect-timeout-ms');
    if (connVal !== null) {
      options.connectTimeoutMs = parsePositiveInt(connVal, '--connect-timeout-ms');
      continue;
    }
    const connLimitVal = readFlagValue('--connection-limit');
    if (connLimitVal !== null) {
      options.connectionLimit = parsePositiveInt(connLimitVal, '--connection-limit');
      continue;
    }

    throw new Error(`خيار غير معروف: ${arg}`);
  }

  if (options.json && options.ndjson) {
    throw new Error('لا يمكن الجمع بين --json و --ndjson في نفس التشغيل');
  }

  return options;
}

function extractLandingBundleSlugs(backendRoot = BACKEND_ROOT) {
  const file = path.join(backendRoot, 'routes/lpAdminRoutes.js');
  const source = fs.readFileSync(file, 'utf8');
  const slugs = new Set();
  const re = /bundleSlug:\s*'([^']+)'/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    slugs.add(match[1]);
  }
  return Array.from(slugs).sort();
}

function resolveDatabaseTarget(env = process.env) {
  if (env.POSTGRES_URL) {
    const isBouncer = env.POSTGRES_URL.includes(':6432') || env.POSTGRES_URL.includes('pgbouncer=true');
    return { url: env.POSTGRES_URL, usingPgBouncer: isBouncer, source: 'POSTGRES_URL' };
  }
  if (env.DATABASE_URL) {
    const isBouncer = env.DATABASE_URL.includes(':6432') || env.DATABASE_URL.includes('pgbouncer=true');
    return { url: env.DATABASE_URL, usingPgBouncer: isBouncer, source: 'DATABASE_URL' };
  }
  if (env.PG_BOUNCER_URL) {
    return { url: env.PG_BOUNCER_URL, usingPgBouncer: true, source: 'PG_BOUNCER_URL' };
  }
  return { url: null, usingPgBouncer: false, source: null };
}

function buildConnectionUrl(
  rawUrl,
  {
    usingPgBouncer = false,
    connectTimeoutMs = 10000,
    pgBouncerPrepared = false,
    connectionLimit = null,
    lockTimeoutMs = null,
    queryTimeoutMs = null,
  } = {}
) {
  const parsed = new URL(rawUrl);
  const timeoutSeconds = String(Math.max(1, Math.ceil(connectTimeoutMs / 1000)));

  const effectiveLimit = connectionLimit !== null && connectionLimit !== undefined
    ? String(connectionLimit)
    : (usingPgBouncer ? '3' : '1');

  parsed.searchParams.set('connection_limit', effectiveLimit);
  parsed.searchParams.set('connect_timeout', timeoutSeconds);
  parsed.searchParams.set('pool_timeout', timeoutSeconds);
  if (usingPgBouncer && !pgBouncerPrepared) {
    parsed.searchParams.set('pgbouncer', 'true');
  }

  // إضافة خيارات GUC لمستوى الجلسة في PostgreSQL عند تحديدها
  if (lockTimeoutMs || queryTimeoutMs) {
    const pgOpts = [];
    if (queryTimeoutMs) pgOpts.push(`-c statement_timeout=${queryTimeoutMs}ms`);
    if (lockTimeoutMs) pgOpts.push(`-c lock_timeout=${lockTimeoutMs}ms`);
    pgOpts.push('-c default_transaction_read_only=on');
    const existingOptions = parsed.searchParams.get('options') || '';
    if (!existingOptions.includes('statement_timeout')) {
      parsed.searchParams.set('options', existingOptions ? `${existingOptions} ${pgOpts.join(' ')}` : pgOpts.join(' '));
    }
  }

  return parsed.toString();
}

function loadPrismaConstructor(backendRoot = BACKEND_ROOT) {
  const candidates = [
    path.join(backendRoot, 'prisma', 'generated', 'postgresql_v2'),
    path.join(backendRoot, 'node_modules', '.prisma', 'client'),
    '@prisma/client',
  ];
  let lastError = null;
  for (const candidate of candidates) {
    try {
      const imported = require(candidate);
      const Ctor = imported.PrismaClient || imported.default || imported;
      if (typeof Ctor === 'function') {
        return Ctor;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('تعذّر تحميل PrismaClient');
}

function withTimeout(promise, timeoutMs, label) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`انتهت المهلة (${timeoutMs}ms) أثناء: ${label}`);
      err.code = 'AUDIT_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

function writeLine(stream, text) {
  if (!stream || typeof stream.write !== 'function') return;
  stream.write(`${text}\n`);
}

function createEmitter(options, stdout, stderr, onTerminalOutput) {
  const emitNdjson = (payload) => {
    writeLine(stdout, JSON.stringify(payload));
  };

  const emitProgress = (line) => {
    if (options.ndjson) return;
    if (options.json) {
      if (!options.quiet) {
        writeLine(stderr, line);
      }
      return;
    }
    writeLine(stdout, line);
  };

  const markTerminal = () => {
    if (typeof onTerminalOutput === 'function') {
      onTerminalOutput();
    }
  };

  return {
    onStart(meta) {
      if (options.ndjson) {
        emitNdjson({ event: 'start', ...meta });
      } else {
        emitProgress(
          `=== 621f2800 — dry-run (read-only) | lockTimeout=${meta.lockTimeoutMs}ms queryTimeout=${meta.queryTimeoutMs}ms totalTimeout=${meta.totalTimeoutMs}ms ===`
        );
      }
    },
    onConnecting(meta) {
      if (options.ndjson) {
        emitNdjson({ event: 'connecting', ...meta });
      } else {
        emitProgress(`[audit] جاري فتح الاتصال بقاعدة البيانات (${meta.source || 'default'})...`);
      }
    },
    onConnected(meta) {
      if (options.ndjson) {
        emitNdjson({ event: 'connected', ...meta });
      } else {
        emitProgress(`[audit] تم فتح الاتصال بقاعدة البيانات بنجاح (${meta.durationMs}ms)`);
      }
    },
    onStepStart(step, label) {
      if (options.ndjson) {
        emitNdjson({ event: 'step_start', step, label });
      } else if (options.json) {
        if (!options.quiet) {
          writeLine(stderr, `[audit] بدء ${step}...`);
        }
      } else {
        writeLine(stdout, `[audit] بدء فحص ${step}...`);
      }
    },
    onStep(step, durationMs, lines, data) {
      if (options.ndjson) {
        emitNdjson({ event: 'step', step, durationMs, data });
        return;
      }
      if (options.json) {
        emitProgress(`[audit] ${step} OK (${durationMs}ms)`);
        return;
      }
      for (const line of lines) {
        emitProgress(line);
      }
    },
    onReport(report) {
      markTerminal();
      if (options.ndjson) {
        emitNdjson({ event: 'report', report });
        return;
      }
      if (options.json) {
        writeLine(stdout, JSON.stringify(report, null, 2));
        return;
      }
      const { verdict, timingsMs } = report;
      emitProgress(
        `النتيجة: missing=${verdict.bundlesReferencedButMissing} · orphan=${verdict.orphanBundles} · safeToClean=${verdict.safeToCleanCount} · blockedByActiveSubscriptions=${verdict.blockedByActiveSubscriptions}`
      );
      emitProgress(`مفيش أي كتابة أو حذف في السكربت ده. (اكتمل في ${timingsMs.totalMs}ms)`);
    },
    onError(report, message) {
      markTerminal();
      if (options.ndjson) {
        emitNdjson({ event: 'error', error: message, report });
        return;
      }
      if (options.json) {
        writeLine(stdout, JSON.stringify(report, null, 2));
        if (!options.quiet) {
          writeLine(stderr, `[audit] ERROR: ${message}`);
        }
        return;
      }
      writeLine(stderr, `❌ ${message}`);
    },
  };
}

async function disconnectSafely(prisma) {
  if (!prisma || typeof prisma.$disconnect !== 'function') return true;
  let clean = true;
  await withTimeout(prisma.$disconnect(), 2000, 'إغلاق اتصال قاعدة البيانات').catch(() => {
    clean = false;
  });
  return clean;
}

async function createConnectedPrisma(options, backendRoot = BACKEND_ROOT, env = process.env, connectBudgetMs = options.connectTimeoutMs) {
  const target = resolveDatabaseTarget(env);
  if (!target.url) {
    throw new Error('لم يتم العثور على رابط قاعدة البيانات (POSTGRES_URL أو DATABASE_URL أو PG_BOUNCER_URL)');
  }

  const effectiveConnectTimeoutMs = Math.max(1, Math.min(options.connectTimeoutMs, connectBudgetMs));
  const effectiveConnectionLimit = options.connectionLimit || (target.usingPgBouncer ? 3 : 2);
  const connectionUrl = buildConnectionUrl(target.url, {
    usingPgBouncer: target.usingPgBouncer,
    connectTimeoutMs: effectiveConnectTimeoutMs,
    pgBouncerPrepared: env.PG_BOUNCER_PREPARED === '1',
    connectionLimit: effectiveConnectionLimit,
    lockTimeoutMs: options.lockTimeoutMs,
    queryTimeoutMs: options.queryTimeoutMs,
  });

  const PrismaClient = loadPrismaConstructor(backendRoot);
  const prisma = new PrismaClient({
    datasources: { db: { url: connectionUrl } },
    log: [],
    errorFormat: 'minimal',
  });

  try {
    await withTimeout(prisma.$connect(), effectiveConnectTimeoutMs, 'فتح اتصال قاعدة البيانات');
    return { prisma, source: target.source };
  } catch (err) {
    await disconnectSafely(prisma);
    throw err;
  }
}

async function runAudit(deps = {}) {
  const argv = deps.argv || process.argv.slice(2);
  const env = deps.env || process.env;
  const stdout = deps.stdout || process.stdout;
  const stderr = deps.stderr || process.stderr;
  const backendRoot = deps.backendRoot || BACKEND_ROOT;

  const options = deps.options ? { ...DEFAULT_OPTIONS, ...deps.options } : parseOptions(argv, env);
  const emitter = createEmitter(options, stdout, stderr, deps.onTerminalOutput);

  const startedAt = Date.now();
  const deadlineAt = startedAt + options.totalTimeoutMs;

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'dry-run (read-only)',
    bundles: { total: 0, active: 0, inactive: 0, slugs: [] },
    landingReferences: { slugs: [], missing: [], orphaned: [] },
    subscriptions: { total: 0, byStatus: {}, activeCompanies: 0 },
    landingPages: { total: 0, withBundleSlug: 0 },
    bundleSafety: [],
    destructiveActions: 'none — this script never deletes or updates rows',
    timingsMs: { connectMs: 0, steps: {}, totalMs: 0 },
  };

  let prisma = deps.prisma || null;
  const ownsPrisma = !deps.prisma;
  let timedOut = false;
  let disconnectClean = true;

  const remainingMs = () => deadlineAt - Date.now();

  const runReadOnlyQuery = async (label, sql, params = []) => {
    const left = remainingMs();
    if (left <= 0) {
      timedOut = true;
      const err = new Error(`تجاوزت المهلة الإجمالية (${options.totalTimeoutMs}ms) قبل: ${label}`);
      err.code = 'AUDIT_TIMEOUT';
      throw err;
    }

    const effectiveQueryTimeoutMs = Math.max(1, Math.min(options.queryTimeoutMs, left));
    const effectiveLockTimeoutMs = Math.max(1, Math.min(options.lockTimeoutMs, effectiveQueryTimeoutMs));
    const t0 = Date.now();

    emitter.onStepStart(label, label);

    const execute = async () => {
      if (typeof prisma.$transaction === 'function') {
        return prisma.$transaction(
          async (tx) => {
            await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
            await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${effectiveLockTimeoutMs}ms'`);
            await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '${effectiveQueryTimeoutMs}ms'`);
            return tx.$queryRawUnsafe(sql, ...params);
          },
          {
            maxWait: Math.min(options.connectTimeoutMs, effectiveQueryTimeoutMs),
            timeout: effectiveQueryTimeoutMs + 500,
          }
        );
      }
      return prisma.$queryRawUnsafe(sql, ...params);
    };

    try {
      const rows = await withTimeout(execute(), effectiveQueryTimeoutMs + 500, label);
      const durationMs = Date.now() - t0;
      report.timingsMs.steps[label] = durationMs;
      return { rows: Array.isArray(rows) ? rows : [], durationMs };
    } catch (err) {
      if (err && err.code === 'AUDIT_TIMEOUT') {
        timedOut = true;
      }
      report.timingsMs.steps[label] = Date.now() - t0;
      throw new Error(`${label}: ${err.message}`);
    }
  };

  let outcome = null;
  try {
    emitter.onStart({
      lockTimeoutMs: options.lockTimeoutMs,
      queryTimeoutMs: options.queryTimeoutMs,
      totalTimeoutMs: options.totalTimeoutMs,
      connectTimeoutMs: options.connectTimeoutMs,
    });

    const referenced = extractLandingBundleSlugs(backendRoot);
    report.landingReferences.slugs = referenced;

    if (!prisma) {
      const leftForConnect = remainingMs();
      if (leftForConnect <= 0) {
        timedOut = true;
        const err = new Error(`تجاوزت المهلة الإجمالية (${options.totalTimeoutMs}ms) قبل فتح الاتصال`);
        err.code = 'AUDIT_TIMEOUT';
        throw err;
      }
      const target = resolveDatabaseTarget(env);
      emitter.onConnecting({ source: target.source || 'database' });
      const connectStart = Date.now();
      const connected = await createConnectedPrisma(options, backendRoot, env, leftForConnect);
      prisma = connected.prisma;
      report.timingsMs.connectMs = Date.now() - connectStart;
      emitter.onConnected({ source: connected.source, durationMs: report.timingsMs.connectMs });
    }

    // 1) الباقات
    const { rows: bundles, durationMs: bundlesMs } = await runReadOnlyQuery(
      'app_bundles',
      'SELECT id, slug, name, "isActive", "appIds" FROM "app_bundles" ORDER BY slug'
    );

    report.bundles.total = bundles.length;
    report.bundles.slugs = bundles.map((b) => b.slug);
    report.bundles.active = bundles.filter((b) => b.isActive !== false).length;
    report.bundles.inactive = report.bundles.total - report.bundles.active;

    const existing = new Set(report.bundles.slugs);
    report.landingReferences.missing = referenced.filter((slug) => !existing.has(slug));
    report.landingReferences.orphaned = report.bundles.slugs.filter((slug) => !referenced.includes(slug));

    const step1Lines = [
      `[1/6] الباقات (${bundlesMs}ms): ${report.bundles.total} (نشطة ${report.bundles.active} · موقوفة ${report.bundles.inactive})`,
      `مراجع صفحات الهبوط: ${referenced.length} → مفقودة: ${report.landingReferences.missing.length} · يتيمة: ${report.landingReferences.orphaned.length}`,
    ];
    if (report.landingReferences.missing.length) {
      step1Lines.push(`  ❌ مفقودة: ${report.landingReferences.missing.join(', ')}`);
    }
    if (report.landingReferences.orphaned.length) {
      step1Lines.push(`  🧹 يتيمة: ${report.landingReferences.orphaned.join(', ')}`);
    }
    emitter.onStep('app_bundles', bundlesMs, step1Lines, {
      bundles: report.bundles,
      landingReferences: report.landingReferences,
    });

    // 2) الاشتراكات — الحالة NULL بتظهر صريحة بدل ما تتوه في التجميع
    const { rows: subs, durationMs: subsMs } = await runReadOnlyQuery(
      'platform_subscriptions',
      `SELECT COALESCE("status"::text, 'NULL') AS status, COUNT(*)::int AS count
       FROM "platform_subscriptions"
       GROUP BY 1
       ORDER BY 1`
    );

    report.subscriptions.byStatus = subs.reduce((acc, row) => {
      acc[row.status] = Number(row.count) || 0;
      report.subscriptions.total += Number(row.count) || 0;
      return acc;
    }, {});

    const { rows: rawSubTotal, durationMs: subTotalMs } = await runReadOnlyQuery(
      'platform_subscriptions total',
      'SELECT COUNT(*)::int AS total FROM "platform_subscriptions"'
    );

    const totalRows = rawSubTotal[0] ? Number(rawSubTotal[0].total) || 0 : 0;
    report.subscriptions.rowsInTable = totalRows;
    report.subscriptions.unaccounted = totalRows - report.subscriptions.total;

    emitter.onStep(
      'platform_subscriptions',
      subsMs + subTotalMs,
      [
        `[2/6] الاشتراكات (${subsMs + subTotalMs}ms): ${report.subscriptions.total} — ${JSON.stringify(report.subscriptions.byStatus)} · صفوف الجدول: ${report.subscriptions.rowsInTable} · غير محسوب: ${report.subscriptions.unaccounted}`,
      ],
      {
        subscriptions: {
          total: report.subscriptions.total,
          byStatus: report.subscriptions.byStatus,
          rowsInTable: report.subscriptions.rowsInTable,
          unaccounted: report.subscriptions.unaccounted,
        },
      }
    );

    // 3) الشركات اللي عليها اشتراك نشط/تجريبي (حماية الباقات)
    const { rows: activeSubCompanies, durationMs: activeCoMs } = await runReadOnlyQuery(
      'active subscriptions companies',
      `SELECT DISTINCT "companyId" FROM "platform_subscriptions"
       WHERE "status"::text IN ('ACTIVE', 'TRIAL')`
    );
    const activeCompanyIds = activeSubCompanies.map((r) => String(r.companyId));
    report.subscriptions.activeCompanies = activeCompanyIds.length;

    emitter.onStep(
      'active_companies',
      activeCoMs,
      [`[3/6] الشركات النشطة/التجريبية (${activeCoMs}ms): ${report.subscriptions.activeCompanies}`],
      { activeCompanies: report.subscriptions.activeCompanies }
    );

    // 4) تطبيقات الشركات النشطة (لربط الباقة بأصحابها الفعليين)
    const { rows: appRows, durationMs: appsMs } = await runReadOnlyQuery(
      'marketplace_apps',
      'SELECT id, slug FROM "marketplace_apps"'
    );
    const slugById = new Map(appRows.map((a) => [String(a.id), String(a.slug)]));
    const knownSlugs = new Set(appRows.map((a) => String(a.slug)));

    let activeCompanyApps = [];
    let companyAppsMs = 0;
    if (activeCompanyIds.length > 0) {
      const caResult = await runReadOnlyQuery(
        'company_apps',
        `SELECT ca."companyId", a.slug
         FROM "company_apps" ca
         JOIN "marketplace_apps" a ON a.id = ca."appId"
         WHERE ca."status" = 'ACTIVE'
           AND ca."companyId" = ANY($1::text[])`,
        [activeCompanyIds]
      );
      activeCompanyApps = caResult.rows;
      companyAppsMs = caResult.durationMs;
    }

    const appsByCompany = new Map();
    for (const row of activeCompanyApps) {
      const cid = String(row.companyId);
      if (!appsByCompany.has(cid)) appsByCompany.set(cid, new Set());
      appsByCompany.get(cid).add(String(row.slug));
    }

    emitter.onStep(
      'company_apps',
      appsMs + companyAppsMs,
      [
        `[4/6] تطبيقات الشركات النشطة (${appsMs + companyAppsMs}ms): ${appRows.length} تطبيق · ${activeCompanyApps.length} ربط نشط`,
      ],
      { appsCount: appRows.length, activeCompanyAppsCount: activeCompanyApps.length }
    );

    // 5) لكل باقة: كام شركة نشطة بتستخدم أي تطبيق من تطبيقاتها
    emitter.onStepStart('bundle_safety', 'تحليل أمان الباقات');
    const safetyStart = Date.now();
    report.bundleSafety = computeBundleSafety({
      bundles,
      referencedSlugs: referenced,
      activeCompanyIds,
      appsByCompany,
      slugById,
      knownSlugs,
    });
    const safetyMs = Date.now() - safetyStart;

    const safetyLines = [
      `[5/6] تحليل أمان الباقات (${safetyMs}ms):`,
      ...report.bundleSafety.map(
        (b) =>
          `  - ${b.slug}: orphan=${b.orphaned} · شركات نشطة=${b.activeSubscriberCompanies} · safe=${b.safeToClean}`
      ),
    ];
    emitter.onStep('bundle_safety', safetyMs, safetyLines, { bundleSafety: report.bundleSafety });

    // 6) صفحات الهبوط المرجعية — العمود اسمه "bundleSlug" في المخطط الحالي وbundle_slug في القديم
    const { rows: pageColumns, durationMs: pageColsMs } = await runReadOnlyQuery(
      'lp_pages columns',
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'lp_pages'
         AND column_name IN ('bundle_slug', 'bundleSlug')`
    );

    let pageCountsMs = 0;
    const columnName = pageColumns
      .map((r) => r.column_name)
      .find((name) => name === 'bundle_slug' || name === 'bundleSlug');
    if (columnName) {
      const quoted = `"${columnName}"`;
      const pagesResult = await runReadOnlyQuery(
        'lp_pages counts',
        `SELECT COUNT(*)::int AS total,
                COUNT(NULLIF(${quoted}, ''))::int AS with_bundle
         FROM "lp_pages"`
      );
      pageCountsMs = pagesResult.durationMs;
      report.landingPages.column = columnName;
      if (pagesResult.rows[0]) {
        report.landingPages.total = Number(pagesResult.rows[0].total) || 0;
        report.landingPages.withBundleSlug = Number(pagesResult.rows[0].with_bundle) || 0;
      }
    } else {
      report.landingPages.note = 'عمود bundleSlug/bundle_slug غير موجود على lp_pages — تم تخطي العدّ';
    }

    const lpLine = columnName
      ? `[6/6] صفحات الهبوط (${pageColsMs + pageCountsMs}ms): ${report.landingPages.total} (بها ${report.landingPages.column}: ${report.landingPages.withBundleSlug})`
      : `[6/6] صفحات الهبوط (${pageColsMs}ms): ${report.landingPages.note}`;
    emitter.onStep('lp_pages', pageColsMs + pageCountsMs, [lpLine], { landingPages: report.landingPages });

    report.verdict = {
      bundlesReferencedButMissing: report.landingReferences.missing.length,
      orphanBundles: report.landingReferences.orphaned.length,
      safeToCleanCount: report.bundleSafety.filter((b) => b.safeToClean).length,
      blockedByActiveSubscriptions: report.subscriptions.byStatus.ACTIVE || 0,
      bundlesWithActiveSubscribers: report.bundleSafety.filter((b) => b.activeSubscriberCompanies > 0).length,
    };

    report.timingsMs.totalMs = Date.now() - startedAt;
    emitter.onReport(report);
    outcome = { exitCode: 0, report, needsForceExit: false };
  } catch (err) {
    if (err && err.code === 'AUDIT_TIMEOUT') {
      timedOut = true;
    }
    report.timingsMs.totalMs = Date.now() - startedAt;
    report.error = err && err.message ? err.message : String(err);
    emitter.onError(report, report.error);
    outcome = { exitCode: 1, report, error: err, needsForceExit: timedOut };
  } finally {
    if (ownsPrisma) {
      disconnectClean = await disconnectSafely(prisma);
    }
    if (outcome && (!disconnectClean || timedOut)) {
      outcome.needsForceExit = true;
    }
  }
  return outcome;
}

function printHelp() {
  console.log(`audit-bundles-dry-run.js — Task 621f2800 (قراءة فقط)

الاستخدام:
  node apps/backend/scripts/one-off/audit-bundles-dry-run.js [options]

الخيارات:
  --json                       طباعة التقرير JSON صافي على stdout مع التقدم على stderr
  --ndjson                     بث أحداث JSON سطرًا بسطر على stdout
  --quiet                      إخفاء سطور التقدم على stderr في وضع --json
  --timeout-ms=<ms>            المهلة الإجمالية للسكربت (افتراضي ${DEFAULT_OPTIONS.totalTimeoutMs})
  --query-timeout-ms=<ms>      مهلة الاستعلام الواحد (افتراضي ${DEFAULT_OPTIONS.queryTimeoutMs})
  --lock-timeout-ms=<ms>       مهلة انتظار الأقفال lock_timeout (افتراضي ${DEFAULT_OPTIONS.lockTimeoutMs})
  --connect-timeout-ms=<ms>    مهلة فتح الاتصال (افتراضي ${DEFAULT_OPTIONS.connectTimeoutMs})
  --connection-limit=<num>     حد اتصالات Prisma (افتراضي 2 للمباشر، 3 لـ PgBouncer)
  -h, --help                   عرض هذه المساعدة`);
}

async function main() {
  // 🛡️ Prevent hanging on stdin in non-interactive/no-tty execution (e.g. </dev/null or automated runner)
  if (process.stdin && typeof process.stdin.pause === 'function') {
    try {
      process.stdin.pause();
      if (typeof process.stdin.unref === 'function') {
        process.stdin.unref();
      }
    } catch (_) {}
  }

  let options;
  try {
    options = parseOptions(process.argv.slice(2), process.env);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  let emittedTerminal = false;
  let watchdog = null;
  if (options.totalTimeoutMs > 0) {
    // حارس نهائي: يضمن عدم بقاء العملية معلقة في أي ظرف
    watchdog = setTimeout(() => {
      const msg = `تجاوزت المهلة الإجمالية القصوى للسكربت (${options.totalTimeoutMs}ms) — إيقاف فوري`;
      if (!emittedTerminal) {
        emittedTerminal = true;
        if (options.ndjson) {
          process.stdout.write(JSON.stringify({ event: 'error', error: msg }) + '\n');
        } else if (options.json) {
          process.stdout.write(JSON.stringify({ mode: 'dry-run (read-only)', error: msg }, null, 2) + '\n');
        }
      }
      process.stderr.write(`❌ ${msg}\n`);
      process.exit(1);
    }, options.totalTimeoutMs + 1000);
  }

  let result = null;
  try {
    result = await runAudit({
      options,
      onTerminalOutput: () => {
        emittedTerminal = true;
      },
    });
    process.exitCode = result.exitCode;
  } catch (fatalErr) {
    process.stderr.write(`❌ خطأ غير متوقع: ${fatalErr && fatalErr.message ? fatalErr.message : fatalErr}\n`);
    process.exitCode = 1;
  } finally {
    if (watchdog) {
      clearTimeout(watchdog);
    }
  }

  // خروج فوري لتفريغ أي اتصالات أو sockets لمحرك Prisma في الخلفية
  process.exit(result ? result.exitCode : (process.exitCode || 0));
}

if (require.main === module) {
  main().catch((err) => {
    console.error('audit-bundles-dry-run failed:', err && err.message ? err.message : err);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_OPTIONS,
  parseOptions,
  extractLandingBundleSlugs,
  resolveDatabaseTarget,
  buildConnectionUrl,
  runAudit,
};
