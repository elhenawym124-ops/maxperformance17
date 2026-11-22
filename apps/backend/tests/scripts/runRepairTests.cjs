/**
 * Standalone Test Runner for Task 791436c4 (Zero external dependencies)
 * Runs all unit tests covering the 3 customer matching/repair cases:
 *   Case 1: جديد (Brand new customer / phone)
 *   Case 2: نفس التليفون بصيغة مختلفة (Same phone, different formats e.g. +2010... vs 010...)
 *   Case 3: مختلف (Different phones under same shared customer separated into distinct customers)
 * Plus: dry-run, apply, rollback, idempotency, batching, and limit.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const {
  repairSharedCustomers,
  executeRollback,
  countSharedCustomers,
} = require('../../scripts/repair-shared-customers');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  process.stdout.write(`  ⏳ ${name}... `);
  try {
    await fn();
    passedTests++;
    console.log(`✅ PASS`);
  } catch (err) {
    failedTests++;
    console.log(`❌ FAIL`);
    console.error(`     Error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    }
  }
}

function setupFixtures() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repair-test-run-'));
  const customers = [
    {
      id: 'cust_shared_1',
      companyId: 'comp-100',
      firstName: 'الحميراء',
      lastName: 'محمد',
      phone: '01284640768',
      phoneNormalized: '+201284640768',
    },
  ];

  const orders = [
    {
      id: 'ord_1',
      companyId: 'comp-100',
      orderNumber: '105101',
      customerId: 'cust_shared_1',
      customerName: 'الحميراء محمد',
      customerPhone: '01284640768',
      customer: customers[0],
    },
    {
      id: 'ord_2',
      companyId: 'comp-100',
      orderNumber: '105102',
      customerId: 'cust_shared_1',
      customerName: 'نهى سامي محمد',
      customerPhone: '01153770958',
      customer: customers[0],
    },
    {
      id: 'ord_3',
      companyId: 'comp-100',
      orderNumber: '105103',
      customerId: 'cust_shared_1',
      customerName: 'أحمد شريف',
      customerPhone: '01222710584',
      customer: customers[0],
    },
    {
      id: 'ord_no_phone',
      companyId: 'comp-100',
      orderNumber: '105104',
      customerId: 'cust_shared_1',
      customerName: 'عميل مجهول',
      customerPhone: null,
      customer: customers[0],
    },
  ];

  function createMockPrisma() {
    return {
      order: {
        findMany: async ({ where }) => {
          return orders
            .filter((o) => {
              if (where?.companyId && o.companyId !== where.companyId) return false;
              if (where?.customerId?.in && !where.customerId.in.includes(o.customerId)) return false;
              return true;
            })
            .map((o) => ({
              ...o,
              customer: customers.find((c) => c.id === o.customerId) || null,
            }));
        },
        count: async ({ where }) => {
          return orders.filter((o) => {
            if (where?.companyId && o.companyId !== where.companyId) return false;
            if (where?.customerId && o.customerId !== where.customerId) return false;
            return true;
          }).length;
        },
        findFirst: async ({ where }) => {
          return orders.find((o) => {
            if (where?.companyId && o.companyId !== where.companyId) return false;
            if (where?.orderNumber && o.orderNumber !== where.orderNumber) return false;
            return true;
          }) || null;
        },
        update: async ({ where, data }) => {
          const ord = orders.find((o) => o.id === where.id);
          if (ord) {
            ord.customerId = data.customerId;
          }
          return ord;
        },
      },
      customer: {
        findMany: async ({ where }) => {
          return customers.filter((c) => {
            if (where?.companyId && c.companyId !== where.companyId) return false;
            if (where?.id?.in && !where.id.in.includes(c.id)) return false;
            if (where?.OR) {
              return where.OR.some((cond) => {
                if (cond.phoneNormalized?.in && cond.phoneNormalized.in.includes(c.phoneNormalized)) return true;
                if (cond.phone?.in && cond.phone.in.includes(c.phone)) return true;
                return false;
              });
            }
            return true;
          });
        },
        findFirst: async ({ where }) => {
          return customers.find((c) => {
            if (where.companyId && c.companyId !== where.companyId) return false;
            if (where.OR) {
              return where.OR.some((cond) => {
                if (cond.phoneNormalized && c.phoneNormalized === cond.phoneNormalized) return true;
                if (cond.phone && c.phone === cond.phone) return true;
                return false;
              });
            }
            return true;
          }) || null;
        },
        create: async ({ data }) => {
          const newCust = {
            id: `new_cust_${customers.length + 1}`,
            ...data,
          };
          customers.push(newCust);
          return newCust;
        },
      },
    };
  }

  return { tempDir, customers, orders, createMockPrisma };
}

async function main() {
  console.log('\n======================================================');
  console.log('🧪 Running Suite: Repair Shared Customers & Matching (Task 791436c4)');
  console.log('======================================================\n');

  // Test 1: dry-run
  await runTest('1. dry-run does NOT write anything to database or disk', async () => {
    const { tempDir, customers, createMockPrisma } = setupFixtures();
    try {
      const mockPrisma = createMockPrisma();
      const report = await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: false,
        outputDir: tempDir,
      });

      assert.strictEqual(report.apply, false);
      assert.strictEqual(report.totalOrdersBefore, 4);
      assert.strictEqual(report.totalOrdersAfter, 4);
      assert.strictEqual(report.ordersMoved, 2);
      assert.strictEqual(report.newCustomersCreated, 2);
      assert.strictEqual(report.rollbackFile, null);
      assert.strictEqual(customers.length, 1);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test 2: apply + rollback file
  await runTest('2. --apply creates rollback file, creates customers, and updates orders', async () => {
    const { tempDir, customers, orders, createMockPrisma } = setupFixtures();
    try {
      const mockPrisma = createMockPrisma();
      const report = await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: true,
        outputDir: tempDir,
      });

      assert.strictEqual(report.apply, true);
      assert.strictEqual(report.ordersMoved, 2);
      assert.strictEqual(report.newCustomersCreated, 2);
      assert.ok(report.rollbackFile && fs.existsSync(report.rollbackFile));

      const rollbackContent = JSON.parse(fs.readFileSync(report.rollbackFile, 'utf8'));
      assert.strictEqual(rollbackContent.length, 2);
      assert.strictEqual(rollbackContent[0].orderId, 'ord_2');
      assert.strictEqual(rollbackContent[0].oldCustomerId, 'cust_shared_1');

      const ord2 = orders.find((o) => o.id === 'ord_2');
      assert.notStrictEqual(ord2.customerId, 'cust_shared_1');
      const ord1 = orders.find((o) => o.id === 'ord_1');
      assert.strictEqual(ord1.customerId, 'cust_shared_1');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test 3: idempotency
  await runTest('3. idempotency: re-running --apply moves 0 orders and creates 0 duplicate customers', async () => {
    const { tempDir, customers, createMockPrisma } = setupFixtures();
    try {
      const mockPrisma = createMockPrisma();
      await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: true,
        outputDir: tempDir,
      });

      const custCountAfterFirst = customers.length;
      assert.strictEqual(custCountAfterFirst, 3);

      const secondReport = await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: true,
        outputDir: tempDir,
      });

      assert.strictEqual(secondReport.ordersMoved, 0);
      assert.strictEqual(secondReport.newCustomersCreated, 0);
      assert.strictEqual(customers.length, custCountAfterFirst);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test 4: rollback execution
  await runTest('4. --rollback restores all orders to their original customerId', async () => {
    const { tempDir, orders, createMockPrisma } = setupFixtures();
    try {
      const mockPrisma = createMockPrisma();
      const report = await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: true,
        outputDir: tempDir,
      });

      assert.notStrictEqual(orders.find((o) => o.id === 'ord_2').customerId, 'cust_shared_1');

      const rollbackRes = await executeRollback(mockPrisma, report.rollbackFile);
      assert.strictEqual(rollbackRes.rollback, true);
      assert.strictEqual(rollbackRes.totalOrdersRestored, 2);

      assert.strictEqual(orders.find((o) => o.id === 'ord_2').customerId, 'cust_shared_1');
      assert.strictEqual(orders.find((o) => o.id === 'ord_3').customerId, 'cust_shared_1');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test 5: Case 1 (جديد)
  await runTest('5. [Case 1: جديد] creates a new customer when order has a brand new phone', async () => {
    const { tempDir, customers, orders, createMockPrisma } = setupFixtures();
    try {
      const mockPrisma = createMockPrisma();
      const report = await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: true,
        outputDir: tempDir,
      });

      assert.ok(report.newCustomersCreated >= 1);
      const ord2 = orders.find((o) => o.id === 'ord_2');
      const createdCust = customers.find((c) => c.id === ord2.customerId);
      assert.ok(createdCust, 'Created customer must exist');
      assert.strictEqual(createdCust.phoneNormalized, '+201153770958');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test 6: Case 2 (نفس التليفون بصيغة مختلفة)
  await runTest('6. [Case 2: نفس التليفون بصيغة مختلفة] matches existing customer with alternative phone format', async () => {
    const { tempDir, customers, orders, createMockPrisma } = setupFixtures();
    try {
      customers.push({
        id: 'cust_existing_noha',
        companyId: 'comp-100',
        firstName: 'نهى',
        lastName: 'سامي',
        phone: '+201153770958',
        phoneNormalized: '+201153770958',
      });

      const mockPrisma = createMockPrisma();
      const report = await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: true,
        outputDir: tempDir,
      });

      const ord2 = orders.find((o) => o.id === 'ord_2');
      assert.strictEqual(ord2.customerId, 'cust_existing_noha');
      assert.strictEqual(report.newCustomersCreated, 1); // Only ord_3 created
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test 7: Case 3 (مختلف)
  await runTest('7. [Case 3: مختلف] separates orders with distinct phones into distinct customers', async () => {
    const { tempDir, orders, createMockPrisma } = setupFixtures();
    try {
      const mockPrisma = createMockPrisma();
      await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: true,
        outputDir: tempDir,
      });

      const ord1 = orders.find((o) => o.id === 'ord_1');
      const ord2 = orders.find((o) => o.id === 'ord_2');
      const ord3 = orders.find((o) => o.id === 'ord_3');

      assert.notStrictEqual(ord1.customerId, ord2.customerId);
      assert.notStrictEqual(ord2.customerId, ord3.customerId);
      assert.notStrictEqual(ord1.customerId, ord3.customerId);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test 8: Batching & Limit
  await runTest('8. [Batching & Limit] processes in batches and produces complete JSON report', async () => {
    const { tempDir, createMockPrisma } = setupFixtures();
    try {
      const mockPrisma = createMockPrisma();
      const report = await repairSharedCustomers({
        prisma: mockPrisma,
        company: 'comp-100',
        apply: false,
        batch: 1,
        limit: 1,
        outputDir: tempDir,
      });

      assert.strictEqual(report.batchSize, 1);
      assert.strictEqual(report.limit, 1);
      assert.strictEqual(report.ordersMoved, 2);
      assert.strictEqual(report.ordersTotalBefore, 4);
      assert.strictEqual(report.ordersTotalAfter, 4);
      assert.strictEqual(report.affectedRows, 2);
      assert.ok(report.sharedBefore !== undefined);
      assert.ok(report.sharedAfter !== undefined);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  console.log('\n======================================================');
  console.log(`Results: ${passedTests}/${totalTests} Passed | ${failedTests} Failed`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
