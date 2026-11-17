#!/usr/bin/env node
/**
 * 🛠️ Repair Shared Customers Script
 * 
 * Separates orders incorrectly attached to a shared customer (e.g. WooCommerce store email)
 * and links each order to the correct customer based on canonical phone number.
 *
 * Usage:
 *   node scripts/repair-shared-customers.js --company <companyId> [--apply] [--rollback <file.json>] [--limit N]
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
    company: companyId,
    apply = false,
    rollback: rollbackFile = null,
    limit = null,
    outputDir = __dirname,
  } = options;

  if (rollbackFile) {
    return await executeRollback(prisma, rollbackFile);
  }

  if (!companyId) {
    throw new Error('Missing required option: --company <companyId>');
  }

  // 1. Fetch all orders for this company to measure baseline
  const allOrders = await prisma.order.findMany({
    where: { companyId },
    select: {
      id: true,
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

  const totalOrdersBefore = allOrders.length;
  const sharedCustomersBefore = countSharedCustomers(allOrders);

  // 2. Identify orders whose linked customer's phone != order phone
  let candidateOrders = [];
  let skippedNoPhone = 0;

  for (const order of allOrders) {
    const orderPhoneCanonical = toCanonicalE164(order.customerPhone);
    if (!orderPhoneCanonical) {
      if (order.customerPhone) {
        skippedNoPhone++;
      }
      continue;
    }

    const customer = order.customer;
    const customerPhoneCanonical = customer
      ? (customer.phoneNormalized || toCanonicalE164(customer.phone))
      : null;

    // الخلل: تليفون العميل المطبَّع ≠ تليفون الأوردر المطبَّع (أو العميل مالوش تليفون والأوردر فيه تليفون)
    if (!customer || !customerPhoneCanonical || customerPhoneCanonical !== orderPhoneCanonical) {
      candidateOrders.push({
        ...order,
        orderPhoneCanonical,
      });
    }
  }

  if (limit && Number.isInteger(limit) && limit > 0) {
    candidateOrders = candidateOrders.slice(0, limit);
  }

  let ordersMoved = 0;
  let newCustomersCreated = 0;
  const rollbackRecords = [];
  const localCustomerCache = new Map();

  for (const order of candidateOrders) {
    const orderPhoneCanonical = order.orderPhoneCanonical;

    let targetCustomer = localCustomerCache.get(orderPhoneCanonical) || null;

    if (!targetCustomer) {
      targetCustomer = await prisma.customer.findFirst({
        where: {
          companyId,
          OR: [
            { phoneNormalized: orderPhoneCanonical },
            { phone: orderPhoneCanonical },
          ],
        },
      });

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
