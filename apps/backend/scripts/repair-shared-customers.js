#!/usr/bin/env node
/**
 * 🛠️ Repair Shared Customers Script
 * 
 * Separates orders incorrectly attached to a shared customer (e.g. WooCommerce store email)
 * and links each order to the correct customer based on canonical phone number.
 *
 * Usage:
 *   node scripts/repair-shared-customers.js --company <companyId|slug> [--apply] [--rollback <file.json>] [--limit N]
 */

const fs = require('fs');
const path = require('path');
const { toCanonicalE164 } = require('../utils/phoneNormalization');

function parseArgs(argv) {
  const options = {
    company: null,
    apply: false,
    rollback: null,
    limit: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--company' && i + 1 < argv.length) {
      options.company = argv[++i];
    } else if (arg === '--rollback' && i + 1 < argv.length) {
      options.rollback = argv[++i];
    } else if (arg === '--limit' && i + 1 < argv.length) {
      options.limit = parseInt(argv[++i], 10);
    }
  }
  return options;
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

async function executeRollback(prisma, rollbackFilePath) {
  const resolvedPath = path.resolve(process.cwd(), rollbackFilePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Rollback file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) {
    throw new Error('Invalid rollback file: expected an array of records');
  }

  let restoredCount = 0;
  for (const record of records) {
    const { orderId, oldCustomerId } = record;
    if (!orderId || !oldCustomerId) continue;
    await prisma.order.update({
      where: { id: orderId },
      data: { customerId: oldCustomerId },
    });
    restoredCount++;
  }

  return {
    rollback: true,
    file: resolvedPath,
    totalOrdersRestored: restoredCount,
  };
}

async function repairSharedCustomers(options = {}) {
  const prisma = options.prisma || require('../services/sharedDatabase').getSharedPrismaClient();
  const {
    company: companyInput,
    apply = false,
    rollback: rollbackFile = null,
    limit = null,
    outputDir = __dirname,
  } = options;

  if (rollbackFile) {
    return await executeRollback(prisma, rollbackFile);
  }

  if (!companyInput) {
    throw new Error('Missing required option: --company <companyId>');
  }

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
        // Fetch only orders for contaminated customers
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

  // Fallback path (e.g. for mockPrisma in Jest unit tests)
  if (candidateOrders.length === 0 && (!prisma.$queryRaw || candidateOrders.length === 0)) {
    const allOrders = await prisma.order.findMany({
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
      totalOrdersBefore = allOrders.length;
    }
    sharedCustomersBefore = countSharedCustomers(allOrders);

    for (const order of allOrders) {
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

  if (limit && Number.isInteger(limit) && limit > 0) {
    candidateOrders = candidateOrders.slice(0, limit);
  }

  let ordersMoved = 0;
  let newCustomersCreated = 0;
  const rollbackRecords = [];
  const localCustomerCache = new Map();

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
          if (cust.phoneNormalized) localCustomerCache.set(cust.phoneNormalized, cust);
          if (cust.phone) localCustomerCache.set(cust.phone, cust);
        }
      }
    } catch (_) {}
  }

  // 4. Move orders & create new customers where needed
  for (const order of candidateOrders) {
    const orderPhoneCanonical = order.orderPhoneCanonical;

    let targetCustomer = localCustomerCache.get(orderPhoneCanonical) || null;

    if (!targetCustomer) {
      if (prisma.customer && typeof prisma.customer.findFirst === 'function') {
        targetCustomer = await prisma.customer.findFirst({
          where: {
            companyId,
            OR: [
              { phoneNormalized: orderPhoneCanonical },
              { phone: orderPhoneCanonical },
            ],
          },
        });
      }

      if (targetCustomer) {
        localCustomerCache.set(orderPhoneCanonical, targetCustomer);
      }
    }

    if (!targetCustomer) {
      const rawName = (order.customerName || 'عميل').trim();
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
          id: `dry-run-cust-${orderPhoneCanonical}`,
          firstName,
          lastName,
          phone: order.customerPhone,
          phoneNormalized: orderPhoneCanonical,
        };
      }
      newCustomersCreated++;
      localCustomerCache.set(orderPhoneCanonical, targetCustomer);
    }

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
    ordersMoved++;
  }

  let rollbackPath = null;
  if (apply && rollbackRecords.length > 0) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rollback-${companyId}-${ts}.json`;
    rollbackPath = path.join(outputDir, filename);
    fs.writeFileSync(rollbackPath, JSON.stringify(rollbackRecords, null, 2), 'utf8');
  }

  let totalOrdersAfter = totalOrdersBefore;
  let sharedCustomersAfter = 'N/A (dry-run)';

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
    }

    if (sharedCustomersAfter === 'N/A (dry-run)') {
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
    totalOrdersBefore,
    totalOrdersAfter,
    sharedCustomersBefore,
    sharedCustomersAfter,
    ordersMoved,
    newCustomersCreated,
    skipped_no_phone: skippedNoPhone,
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
      process.exit(1);
    });
}

module.exports = {
  repairSharedCustomers,
  executeRollback,
  countSharedCustomers,
  parseArgs,
};
