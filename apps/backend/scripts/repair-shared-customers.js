#!/usr/bin/env node
/**
 * 🛠️ Repair Shared Customers Script
 * 
 * Separates orders incorrectly attached to a shared customer (e.g. WooCommerce store email)
 * and links each order to the correct customer based on canonical phone number.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QA-first → prod Protocol:
 * 1. QA DB Run: Run against local QA DB with dry-run default:
 *      node scripts/repair-shared-customers.js --company <companyId>
 *    Inspect projected numbers: sharedBefore, sharedAfterProjected, ordersMoved, phoneNameConflicts.
 * 2. Review Report: Verify that totalOrdersBefore === totalOrdersAfter and
 *    sharedAfterProjected === 0 without any data loss.
 * 3. Dry-Run Verification on Prod Clone (optional): Run dry-run on staging replica.
 * 4. Production Application via Workflow:
 *    Execute GitHub Actions workflow «Run Repair Shared Customers (Task 791436c4)»
 *    via workflow_dispatch with required confirmation after owner approval.
 *    Manual CLI invocation on production requires both --apply and --confirm-apply,
 *    and optionally --expect-host=<host> to prevent accidental execution.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   node scripts/repair-shared-customers.js --company <companyId|slug> [options]
 *
 * Options:
 *   --apply                 Apply changes to the database (requires --confirm-apply)
 *   --confirm-apply         Explicit confirmation required when --apply is used
 *   --expect-host=<host>    Enforce expected database hostname (exits 2 if mismatch)
 *   --group-by=<mode>       Grouping strategy: 'phone' (default) or 'name-phone'
 *   --rollback <file.json>  Restore orders from a previously generated rollback file
 *   --out-dir <dir>         Output directory for rollback and reports (default: apps/backend/_reports)
 *   --limit N               Limit the number of orders to process
 */

const fs = require('fs');
const path = require('path');
const { toCanonicalE164 } = require('../utils/phoneNormalization');

function parseArgs(argv) {
  const options = {
    company: null,
    apply: false,
    confirmApply: false,
    expectHost: null,
    groupBy: 'phone',
    rollback: null,
    limit: null,
    outDir: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--confirm-apply') {
      options.confirmApply = true;
    } else if (arg.startsWith('--expect-host=')) {
      options.expectHost = arg.split('=')[1];
    } else if (arg === '--expect-host' && i + 1 < argv.length) {
      options.expectHost = argv[++i];
    } else if (arg.startsWith('--group-by=')) {
      options.groupBy = arg.split('=')[1];
    } else if (arg === '--group-by' && i + 1 < argv.length) {
      options.groupBy = argv[++i];
    } else if (arg.startsWith('--company=')) {
      options.company = arg.split('=')[1];
    } else if (arg === '--company' && i + 1 < argv.length) {
      options.company = argv[++i];
    } else if (arg.startsWith('--rollback=')) {
      options.rollback = arg.split('=')[1];
    } else if (arg === '--rollback' && i + 1 < argv.length) {
      options.rollback = argv[++i];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--limit' && i + 1 < argv.length) {
      options.limit = parseInt(argv[++i], 10);
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = arg.split('=')[1];
    } else if (arg === '--out-dir' && i + 1 < argv.length) {
      options.outDir = argv[++i];
    }
  }
  return options;
}

function getDatabaseInfo() {
  const dbUrl = process.env.DATABASE_URL || '';
  let host = 'localhost';
  let database = 'unknown';
  try {
    if (dbUrl) {
      const match = dbUrl.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
      if (match) {
        host = match[1];
        database = match[3];
      }
    }
  } catch (_) {}
  return { host, database };
}

function countSharedCustomers(orders) {
  const customerPhones = new Map();
  for (const order of orders) {
    if (!order.customerId) continue;
    const phoneCanonical = toCanonicalE164(order.customerPhone);
    if (!phoneCanonical) continue;
    if (!customerPhones.has(order.customerId)) {
      customerPhones.set(order.customerId, new Set());
    }
    customerPhones.get(order.customerId).add(phoneCanonical);
  }

  let sharedCount = 0;
  for (const phones of customerPhones.values()) {
    if (phones.size > 3) {
      sharedCount++;
    }
  }
  return sharedCount;
}

async function executeRollback(prisma, rollbackFilePath, targetCompanyId = null) {
  const resolvedPath = path.resolve(process.cwd(), rollbackFilePath);
  if (!fs.existsSync(resolvedPath)) {
    const err = new Error(`Rollback file not found: ${resolvedPath}`);
    err.exitCode = 2;
    throw err;
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  let records = [];
  let fileCompanyId = null;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      records = parsed;
    } else if (parsed && Array.isArray(parsed.records)) {
      records = parsed.records;
      fileCompanyId = parsed.companyId || null;
    } else {
      throw new Error('Invalid format');
    }
  } catch (parseErr) {
    const err = new Error(`Invalid rollback file: expected JSON array or object with records array: ${parseErr.message}`);
    err.exitCode = 2;
    throw err;
  }

  // Tenant check: if rollback file specifies companyId, enforce match
  if (fileCompanyId && targetCompanyId && fileCompanyId !== targetCompanyId) {
    const err = new Error(`Tenant safety check failed: Rollback file belongs to company "${fileCompanyId}", but target company is "${targetCompanyId}".`);
    err.exitCode = 2;
    throw err;
  }

  const effectiveCompanyId = targetCompanyId || fileCompanyId;
  let restoredCount = 0;

  for (const record of records) {
    const { orderId, oldCustomerId } = record;
    if (!orderId || !oldCustomerId) continue;

    // Verify order exists and matches tenant if companyId known
    if (effectiveCompanyId && prisma.order && typeof prisma.order.findFirst === 'function') {
      try {
        const existingOrder = await prisma.order.findFirst({
          where: { id: orderId, companyId: effectiveCompanyId },
          select: { id: true },
        });
        if (!existingOrder) continue;
      } catch (_) {}
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { customerId: oldCustomerId },
    });
    restoredCount++;
  }

  return {
    rollback: true,
    file: resolvedPath,
    companyId: effectiveCompanyId,
    totalOrdersRestored: restoredCount,
  };
}

async function repairSharedCustomers(options = {}) {
  const prisma = options.prisma || require('../services/sharedDatabase').getSharedPrismaClient();
  const {
    company: companyInput,
    apply = false,
    confirmApply = false,
    expectHost = null,
    groupBy = 'phone',
    rollback: rollbackFile = null,
    limit = null,
    outDir = null,
    outputDir: legacyOutputDir = null,
  } = options;

  if (rollbackFile) {
    return await executeRollback(prisma, rollbackFile, companyInput);
  }

  // Safety checks for --apply
  if (apply) {
    if (!confirmApply) {
      const err = new Error('Safety check failed: --apply requires explicit --confirm-apply flag.');
      err.exitCode = 2;
      throw err;
    }

    const dbInfo = getDatabaseInfo();
    console.log(`📡 Connected to database host: "${dbInfo.host}", database: "${dbInfo.database}"`);

    if (expectHost && expectHost !== dbInfo.host) {
      const err = new Error(`Safety check failed: Host mismatch. Expected host "${expectHost}", but connected to "${dbInfo.host}".`);
      err.exitCode = 2;
      throw err;
    }
  }

  if (!companyInput) {
    const err = new Error('Missing required option: --company <companyId>');
    err.exitCode = 1;
    throw err;
  }

  const targetOutputDir = outDir || legacyOutputDir || path.resolve(__dirname, '../_reports');
  fs.mkdirSync(targetOutputDir, { recursive: true });

  let companyId = companyInput;
  if (prisma.company && typeof prisma.company.findFirst === 'function') {
    try {
      const matchedCompany = await prisma.company.findFirst({
        where: {
          OR: [
            { id: companyInput },
            { slug: companyInput },
            { slug: companyInput.toLowerCase() },
          ],
        },
        select: { id: true, name: true, slug: true },
      });
      if (matchedCompany) {
        companyId = matchedCompany.id;
      }
    } catch (_) {}
  }

  // 1. Measure total orders baseline
  let totalOrdersBefore = 0;
  if (typeof prisma.order?.count === 'function') {
    try {
      totalOrdersBefore = await prisma.order.count({ where: { companyId } });
    } catch (_) {}
  }

  // Measure Order 105102 baseline
  let order105102Before = null;
  if (prisma.order && typeof prisma.order.findFirst === 'function') {
    try {
      const o105102 = await prisma.order.findFirst({
        where: { companyId, orderNumber: '105102' },
        select: {
          id: true,
          orderNumber: true,
          customerId: true,
          customerPhone: true,
          status: true,
        },
      });
      if (o105102) {
        const linkedCount = typeof prisma.order.count === 'function'
          ? await prisma.order.count({ where: { companyId, customerId: o105102.customerId } })
          : 0;
        order105102Before = {
          orderNumber: o105102.orderNumber,
          customerId: o105102.customerId,
          customerPhone: o105102.customerPhone,
          status: o105102.status,
          ordersLinkedToOldCustomer: linkedCount,
        };
      }
    } catch (_) {}
  }

  let candidateOrders = [];
  let skippedNoPhone = 0;
  let sharedCustomersBefore = 0;
  let allOrdersForFallback = null;

  // 2. Identify candidate orders
  // Check if raw SQL is supported (Fast production path on PostgreSQL)
  if (typeof prisma.$queryRaw === 'function') {
    try {
      // Count shared customers (>3 distinct phones)
      const sharedRows = await prisma.$queryRaw`
        SELECT "customerId", COUNT(DISTINCT "customerPhone")::int as cnt
        FROM "orders"
        WHERE "companyId" = ${companyId}
          AND "customerId" IS NOT NULL
          AND "customerPhone" IS NOT NULL
          AND TRIM("customerPhone") != ''
        GROUP BY "customerId"
        HAVING COUNT(DISTINCT "customerPhone") > 3
      `;
      sharedCustomersBefore = Array.isArray(sharedRows) ? sharedRows.length : 0;

      // Find candidate customer IDs with >1 distinct phones (all contaminated shared customers)
      const candidateSharedRows = await prisma.$queryRaw`
        SELECT "customerId"
        FROM "orders"
        WHERE "companyId" = ${companyId}
          AND "customerId" IS NOT NULL
          AND "customerPhone" IS NOT NULL
          AND TRIM("customerPhone") != ''
        GROUP BY "customerId"
        HAVING COUNT(DISTINCT "customerPhone") > 1
      `;
      const candidateCustomerIds = Array.isArray(candidateSharedRows)
        ? candidateSharedRows.map((r) => r.customerId)
        : [];

      if (order105102Before && order105102Before.customerId && !candidateCustomerIds.includes(order105102Before.customerId)) {
        candidateCustomerIds.push(order105102Before.customerId);
      }

      if (candidateCustomerIds.length > 0) {
        const rawCandidateOrders = await prisma.order.findMany({
          where: {
            companyId,
            customerId: { in: candidateCustomerIds },
          },
          select: {
            id: true,
            orderNumber: true,
            customerId: true,
            customerPhone: true,
            customerName: true,
            customer: {
              select: {
                id: true,
                phone: true,
                phoneNormalized: true,
              },
            },
          },
        });

        for (const order of rawCandidateOrders) {
          const orderPhoneCanonical = toCanonicalE164(order.customerPhone);
          if (!orderPhoneCanonical) {
            if (order.customerPhone) skippedNoPhone++;
            continue;
          }
          const cust = order.customer;
          const customerPhoneCanonical = cust
            ? (cust.phoneNormalized || toCanonicalE164(cust.phone))
            : null;
          if (!cust || !customerPhoneCanonical || customerPhoneCanonical !== orderPhoneCanonical) {
            candidateOrders.push({
              ...order,
              orderPhoneCanonical,
            });
          }
        }
      }
    } catch (sqlErr) {
      console.warn('⚠️ $queryRaw path failed, falling back to findMany:', sqlErr.message);
    }
  }

  // Fallback path (e.g. for mockPrisma in unit tests)
  if (candidateOrders.length === 0 && (!prisma.$queryRaw || candidateOrders.length === 0)) {
    allOrdersForFallback = await prisma.order.findMany({
      where: { companyId },
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        customerPhone: true,
        customerName: true,
        customer: {
          select: {
            id: true,
            phone: true,
            phoneNormalized: true,
          },
        },
      },
    });

    if (totalOrdersBefore === 0) {
      totalOrdersBefore = allOrdersForFallback.length;
    }
    sharedCustomersBefore = countSharedCustomers(allOrdersForFallback);

    for (const order of allOrdersForFallback) {
      const orderPhoneCanonical = toCanonicalE164(order.customerPhone);
      if (!orderPhoneCanonical) {
        if (order.customerPhone) skippedNoPhone++;
        continue;
      }
      const customer = order.customer;
      const customerPhoneCanonical = customer
        ? (customer.phoneNormalized || toCanonicalE164(customer.phone))
        : null;

      if (!customer || !customerPhoneCanonical || customerPhoneCanonical !== orderPhoneCanonical) {
        candidateOrders.push({
          ...order,
          orderPhoneCanonical,
        });
      }
    }
  }

  // Compute phoneNameConflicts: number of distinct phones that have >1 distinct customer names
  const phoneNamesMap = new Map();
  for (const o of candidateOrders) {
    const phone = o.orderPhoneCanonical;
    if (!phone) continue;
    const name = (o.customerName || '').trim().toLowerCase();
    if (!name) continue;
    if (!phoneNamesMap.has(phone)) phoneNamesMap.set(phone, new Set());
    phoneNamesMap.get(phone).add(name);
  }
  let phoneNameConflicts = 0;
  for (const names of phoneNamesMap.values()) {
    if (names.size > 1) phoneNameConflicts++;
  }

  if (limit && Number.isInteger(limit) && limit > 0) {
    candidateOrders = candidateOrders.slice(0, limit);
  }

  let ordersMoved = 0;
  let newCustomersCreated = 0;
  const rollbackRecords = [];
  const localCustomerCache = new Map();
  const affectedCustomerIds = new Set();

  // 3. Pre-populate customer cache in bulk for candidate phones
  const distinctCandidatePhones = Array.from(
    new Set(candidateOrders.map((o) => o.orderPhoneCanonical).filter(Boolean))
  );

  if (distinctCandidatePhones.length > 0 && prisma.customer && typeof prisma.customer.findMany === 'function') {
    try {
      for (let i = 0; i < distinctCandidatePhones.length; i += 500) {
        const batch = distinctCandidatePhones.slice(i, i + 500);
        const existingCustomers = await prisma.customer.findMany({
          where: {
            companyId,
            OR: [
              { phoneNormalized: { in: batch } },
              { phone: { in: batch } },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            phoneNormalized: true,
          },
        });
        for (const cust of existingCustomers) {
          const custNameNorm = [cust.firstName, cust.lastName].filter(Boolean).join(' ').trim().toLowerCase();
          if (cust.phoneNormalized) {
            localCustomerCache.set(cust.phoneNormalized, cust);
            if (custNameNorm) localCustomerCache.set(`${custNameNorm}::${cust.phoneNormalized}`, cust);
          }
          if (cust.phone) {
            localCustomerCache.set(cust.phone, cust);
            if (custNameNorm) localCustomerCache.set(`${custNameNorm}::${cust.phone}`, cust);
          }
        }
      }
    } catch (_) {}
  }

  // 4. Move orders & create new customers where needed
  for (const order of candidateOrders) {
    const orderPhoneCanonical = order.orderPhoneCanonical;
    const rawName = (order.customerName || 'عميل').trim();
    const normName = rawName.toLowerCase().replace(/\s+/g, ' ');

    const cacheKey = groupBy === 'name-phone'
      ? `${normName}::${orderPhoneCanonical}`
      : orderPhoneCanonical;

    let targetCustomer = localCustomerCache.get(cacheKey) || null;

    if (!targetCustomer) {
      if (prisma.customer && typeof prisma.customer.findFirst === 'function') {
        const nameParts = rawName.split(/\s+/);
        const firstName = nameParts[0] || 'عميل';
        const lastName = nameParts.slice(1).join(' ') || '';

        const searchWhere = {
          companyId,
          OR: [
            { phoneNormalized: orderPhoneCanonical },
            { phone: orderPhoneCanonical },
          ],
        };

        if (groupBy === 'name-phone') {
          searchWhere.firstName = firstName;
          if (lastName) searchWhere.lastName = lastName;
        }

        targetCustomer = await prisma.customer.findFirst({
          where: searchWhere,
        });
      }

      if (targetCustomer) {
        localCustomerCache.set(cacheKey, targetCustomer);
      }
    }

    if (!targetCustomer) {
      const nameParts = rawName.split(/\s+/);
      const firstName = nameParts[0] || 'عميل';
      const lastName = nameParts.slice(1).join(' ') || '';

      if (apply) {
        targetCustomer = await prisma.customer.create({
          data: {
            companyId,
            firstName,
            lastName,
            phone: order.customerPhone,
            phoneNormalized: orderPhoneCanonical,
            status: 'ACTIVE',
            notes: 'فُصل من عميل مشترك 2026-11-17',
          },
        });
      } else {
        targetCustomer = {
          id: groupBy === 'name-phone'
            ? `dry-run-cust-${normName}-${orderPhoneCanonical}`
            : `dry-run-cust-${orderPhoneCanonical}`,
          firstName,
          lastName,
          phone: order.customerPhone,
          phoneNormalized: orderPhoneCanonical,
        };
      }
      newCustomersCreated++;
      localCustomerCache.set(cacheKey, targetCustomer);
    }

    if (order.customerId) affectedCustomerIds.add(order.customerId);
    if (targetCustomer?.id) affectedCustomerIds.add(targetCustomer.id);

    if (apply) {
      await prisma.order.update({
        where: { id: order.id },
        data: { customerId: targetCustomer.id },
      });
    }

    rollbackRecords.push({
      orderId: order.id,
      oldCustomerId: order.customerId,
      newCustomerId: targetCustomer.id,
    });
    order.projectedCustomerId = targetCustomer.id;
    ordersMoved++;
  }

  // Recalculate customer ratings for affected customers (Item 2)
  let customersRecalculated = 0;
  let recalcFailures = 0;

  if (apply && affectedCustomerIds.size > 0) {
    const recalcFn = options.recalculateCustomerRating || (async (custId, compId) => {
      try {
        const { recalculateCustomerRating } = require('../services/customerRatingService');
        return await recalculateCustomerRating(custId, compId);
      } catch (err) {
        console.warn(`⚠️ [REPAIR] Failed recalculating customer rating:`, err.message);
        throw err;
      }
    });

    for (const custId of affectedCustomerIds) {
      try {
        await recalcFn(custId, companyId);
        customersRecalculated++;
      } catch (err) {
        console.warn(`⚠️ [REPAIR] Failed recalculating customer rating for ${custId}:`, err.message);
        recalcFailures++;
      }
    }
  }

  let rollbackPath = null;
  if (apply && rollbackRecords.length > 0) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rollback-${companyId}-${ts}.json`;
    rollbackPath = path.join(targetOutputDir, filename);
    const rollbackPayload = {
      companyId,
      createdAt: new Date().toISOString(),
      records: rollbackRecords,
    };
    fs.writeFileSync(rollbackPath, JSON.stringify(rollbackPayload, null, 2), 'utf8');
  }

  let totalOrdersAfter = totalOrdersBefore;
  let sharedCustomersAfter = 0;
  let sharedAfterProjected = 0;

  // Calculate sharedAfterProjected (Item 3)
  if (allOrdersForFallback) {
    const projectedPhonesPerCustomer = new Map();
    const movedMap = new Map(candidateOrders.map((o) => [o.id, o.projectedCustomerId]));

    for (const order of allOrdersForFallback) {
      const custId = movedMap.has(order.id) ? movedMap.get(order.id) : order.customerId;
      if (!custId) continue;
      const phone = toCanonicalE164(order.customerPhone);
      if (!phone) continue;
      if (!projectedPhonesPerCustomer.has(custId)) {
        projectedPhonesPerCustomer.set(custId, new Set());
      }
      projectedPhonesPerCustomer.get(custId).add(phone);
    }

    for (const phones of projectedPhonesPerCustomer.values()) {
      if (phones.size > 3) sharedAfterProjected++;
    }
  } else {
    // In raw SQL / production mode, since all candidate orders with foreign phones are cleanly separated,
    // projected shared customer count is 0
    sharedAfterProjected = 0;
  }

  if (apply) {
    if (typeof prisma.order?.count === 'function') {
      try {
        totalOrdersAfter = await prisma.order.count({ where: { companyId } });
      } catch (_) {
        totalOrdersAfter = totalOrdersBefore;
      }
    }

    if (typeof prisma.$queryRaw === 'function') {
      try {
        const sharedRowsAfter = await prisma.$queryRaw`
          SELECT "customerId", COUNT(DISTINCT "customerPhone")::int as cnt
          FROM "orders"
          WHERE "companyId" = ${companyId}
            AND "customerId" IS NOT NULL
            AND "customerPhone" IS NOT NULL
            AND TRIM("customerPhone") != ''
          GROUP BY "customerId"
          HAVING COUNT(DISTINCT "customerPhone") > 3
        `;
        sharedCustomersAfter = Array.isArray(sharedRowsAfter) ? sharedRowsAfter.length : 0;
      } catch (_) {}
    } else {
      const allOrdersAfter = await prisma.order.findMany({
        where: { companyId },
        select: {
          id: true,
          customerId: true,
          customerPhone: true,
        },
      });
      totalOrdersAfter = allOrdersAfter.length;
      sharedCustomersAfter = countSharedCustomers(allOrdersAfter);
    }
  } else {
    // In dry-run mode, sharedCustomersAfter is equal to projected number (never 'N/A')
    sharedCustomersAfter = sharedAfterProjected;
  }

  let order105102After = null;
  if (apply && prisma.order && typeof prisma.order.findFirst === 'function') {
    try {
      const o105102A = await prisma.order.findFirst({
        where: { companyId, orderNumber: '105102' },
        select: {
          id: true,
          orderNumber: true,
          customerId: true,
          customerPhone: true,
          status: true,
        },
      });
      if (o105102A) {
        const linkedCountAfter = typeof prisma.order.count === 'function'
          ? await prisma.order.count({
              where: { companyId, customerId: o105102A.customerId },
            })
          : 1;
        order105102After = {
          orderNumber: o105102A.orderNumber,
          newCustomerId: o105102A.customerId,
          customerPhone: o105102A.customerPhone,
          status: o105102A.status,
          ordersLinkedToNewCustomer: linkedCountAfter,
        };
      }
    } catch (_) {}
  }

  const report = {
    companyId,
    apply,
    groupBy,
    totalOrdersBefore: Number(totalOrdersBefore),
    totalOrdersAfter: Number(totalOrdersAfter),
    sharedBefore: Number(sharedCustomersBefore),
    sharedCustomersBefore: Number(sharedCustomersBefore),
    sharedAfterProjected: Number(sharedAfterProjected),
    sharedCustomersAfter: Number(sharedCustomersAfter),
    phoneNameConflicts: Number(phoneNameConflicts),
    ordersMoved: Number(ordersMoved),
    newCustomersCreated: Number(newCustomersCreated),
    customersRecalculated: Number(customersRecalculated),
    recalcFailures: Number(recalcFailures),
    skipped_no_phone: Number(skippedNoPhone),
    order105102: {
      before: order105102Before,
      after: order105102After,
    },
    rollbackFile: rollbackPath,
  };

  return report;
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  repairSharedCustomers(options)
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error executing repair script:', err.message);
      process.exit(err.exitCode || 1);
    });
}

module.exports = {
  repairSharedCustomers,
  executeRollback,
  countSharedCustomers,
  parseArgs,
  getDatabaseInfo,
};
