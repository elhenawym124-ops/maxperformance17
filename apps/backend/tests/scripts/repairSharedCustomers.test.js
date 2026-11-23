/**
 * Tests for repair-shared-customers script (Task 791436c4)
 * Uses node:test + node:assert for zero-dependency execution.
 */

const { describe, it: test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  repairSharedCustomers,
  executeRollback,
  countSharedCustomers,
} = require('../../scripts/repair-shared-customers');

describe('Repair Shared Customers Script (Task 791436c4)', () => {
  let orders = [];
  let customers = [];
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repair-test-'));
    customers = [
      {
        id: 'cust_shared_1',
        companyId: 'comp-100',
        firstName: 'الحميراء',
        lastName: 'محمد',
        phone: '01284640768',
        phoneNormalized: '+201284640768',
      },
    ];

    orders = [
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
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function createMockPrisma() {
    const updateCalls = [];
    const createCalls = [];

    return {
      order: {
        findMany: async ({ where }) => {
          return orders
            .filter((o) => !where?.companyId || o.companyId === where.companyId)
            .map((o) => ({
              ...o,
              customer: customers.find((c) => c.id === o.customerId) || null,
            }));
        },
        update: async ({ where, data }) => {
          updateCalls.push({ where, data });
          const ord = orders.find((o) => o.id === where.id);
          if (ord) {
            ord.customerId = data.customerId;
          }
          return ord;
        },
        findFirst: async ({ where }) => {
          return orders.find((o) => {
            if (where.id && o.id !== where.id) return false;
            if (where.companyId && o.companyId !== where.companyId) return false;
            if (where.orderNumber && o.orderNumber !== where.orderNumber) return false;
            return true;
          }) || null;
        },
      },
      customer: {
        findMany: async ({ where }) => {
          return customers.filter((c) => {
            if (where.companyId && c.companyId !== where.companyId) return false;
            return true;
          });
        },
        findFirst: async ({ where }) => {
          return customers.find((c) => {
            if (where.companyId && c.companyId !== where.companyId) return false;
            if (where.firstName && c.firstName !== where.firstName) return false;
            if (where.lastName && c.lastName !== where.lastName) return false;
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
          createCalls.push(data);
          const newCust = {
            id: `new_cust_${customers.length + 1}`,
            ...data,
          };
          customers.push(newCust);
          return newCust;
        },
      },
      _calls: {
        updateCalls,
        createCalls,
      },
    };
  }

  test('dry-run does NOT write anything to database or disk', async () => {
    const mockPrisma = createMockPrisma();

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: false,
      outDir: tempDir,
    });

    assert.strictEqual(report.apply, false);
    assert.strictEqual(report.totalOrdersBefore, 4);
    assert.strictEqual(report.totalOrdersAfter, 4);
    assert.strictEqual(report.ordersMoved, 2); // ord_2 and ord_3 have different phones
    assert.strictEqual(report.newCustomersCreated, 2);
    assert.strictEqual(report.skipped_no_phone, 0);
    assert.strictEqual(report.rollbackFile, null);

    // Verify DB wasn't touched
    assert.strictEqual(mockPrisma._calls.updateCalls.length, 0);
    assert.strictEqual(mockPrisma._calls.createCalls.length, 0);
    assert.strictEqual(customers.length, 1);
  });

  test('--apply creates rollback file, creates customers, and updates orders', async () => {
    const mockPrisma = createMockPrisma();

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      outDir: tempDir,
    });

    assert.strictEqual(report.apply, true);
    assert.strictEqual(report.ordersMoved, 2);
    assert.strictEqual(report.newCustomersCreated, 2);
    assert.strictEqual(report.totalOrdersBefore, 4);
    assert.strictEqual(report.totalOrdersAfter, 4);
    assert.ok(report.rollbackFile);
    assert.ok(fs.existsSync(report.rollbackFile));

    // Verify rollback file content and createdCustomerIds
    const rawContent = JSON.parse(fs.readFileSync(report.rollbackFile, 'utf8'));
    const rollbackContent = Array.isArray(rawContent) ? rawContent : rawContent.records;
    assert.strictEqual(rollbackContent.length, 2);
    assert.strictEqual(rollbackContent[0].orderId, 'ord_2');
    assert.strictEqual(rollbackContent[0].oldCustomerId, 'cust_shared_1');
    assert.notStrictEqual(rollbackContent[0].newCustomerId, 'cust_shared_1');

    // Item 3: createdCustomerIds present in rollback file
    assert.ok(Array.isArray(rawContent.createdCustomerIds));
    assert.strictEqual(rawContent.createdCustomerIds.length, 2);

    // Verify orders were updated in DB
    const ord2 = orders.find((o) => o.id === 'ord_2');
    assert.notStrictEqual(ord2.customerId, 'cust_shared_1');
    const ord1 = orders.find((o) => o.id === 'ord_1');
    assert.strictEqual(ord1.customerId, 'cust_shared_1');
  });

  test('idempotency: re-running --apply moves 0 orders and creates 0 duplicate customers', async () => {
    const mockPrisma = createMockPrisma();

    // First run
    await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      outDir: tempDir,
    });

    const customersAfterFirstRun = customers.length;
    assert.strictEqual(customersAfterFirstRun, 3); // original + 2 created

    // Second run
    const secondReport = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      outDir: tempDir,
    });

    assert.strictEqual(secondReport.ordersMoved, 0);
    assert.strictEqual(secondReport.newCustomersCreated, 0);
    assert.strictEqual(customers.length, customersAfterFirstRun);
  });

  test('--rollback restores all orders to their original customerId', async () => {
    const mockPrisma = createMockPrisma();

    // Apply repair
    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      outDir: tempDir,
    });

    assert.notStrictEqual(orders.find((o) => o.id === 'ord_2').customerId, 'cust_shared_1');

    // Execute rollback
    const rollbackResult = await executeRollback(mockPrisma, report.rollbackFile, 'comp-100');
    assert.strictEqual(rollbackResult.rollback, true);
    assert.strictEqual(rollbackResult.totalOrdersRestored, 2);

    // Verify all orders restored
    assert.strictEqual(orders.find((o) => o.id === 'ord_2').customerId, 'cust_shared_1');
    assert.strictEqual(orders.find((o) => o.id === 'ord_3').customerId, 'cust_shared_1');
  });

  test('Item 3: rollback fails closed when tenant check fails or throws error', async () => {
    const mockPrisma = createMockPrisma();

    // Force findFirst on order to throw an error for ord_2
    let updatedOrderIds = [];
    mockPrisma.order.findFirst = async ({ where }) => {
      if (where.id === 'ord_2') {
        throw new Error('Database connection reset during tenant verification');
      }
      return orders.find((o) => o.id === where.id) || null;
    };
    mockPrisma.order.update = async ({ where, data }) => {
      updatedOrderIds.push(where.id);
      return {};
    };

    const rollbackFile = path.join(tempDir, 'test-rollback-fail-closed.json');
    fs.writeFileSync(rollbackFile, JSON.stringify({
      companyId: 'comp-100',
      records: [
        { orderId: 'ord_2', oldCustomerId: 'cust_shared_1' },
        { orderId: 'ord_3', oldCustomerId: 'cust_shared_1' },
      ],
      createdCustomerIds: ['new_cust_2'],
    }));

    const result = await executeRollback(mockPrisma, rollbackFile, 'comp-100');

    // ord_2 check threw -> failed closed (was NOT updated). ord_3 succeeded.
    assert.strictEqual(result.totalOrdersRestored, 1);
    assert.ok(!updatedOrderIds.includes('ord_2'));
    assert.ok(updatedOrderIds.includes('ord_3'));
  });

  test('Item 4: P2002 on customer.create is handled gracefully and reuses existing customer', async () => {
    const mockPrisma = createMockPrisma();

    // Pre-seed an existing customer with the phone that will collide
    customers.push({
      id: 'existing_cust_ahmed',
      companyId: 'comp-100',
      firstName: 'أحمد',
      lastName: 'شريف',
      phone: '01222710584',
      phoneNormalized: '+201222710584',
    });

    // Simulate unique constraint P2002 on creating a customer with this phone
    mockPrisma.customer.create = async ({ data }) => {
      if (data.phoneNormalized === '+201222710584') {
        const p2002Err = new Error('Unique constraint failed on the fields: (`companyId`,`phoneNormalized`)');
        p2002Err.code = 'P2002';
        throw p2002Err;
      }
      const newCust = { id: `created_cust_${customers.length + 1}`, ...data };
      customers.push(newCust);
      return newCust;
    };

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      outDir: tempDir,
    });

    // Successfully moved without crashing and reused existing customer
    assert.strictEqual(report.apply, true);
    assert.strictEqual(report.ordersMoved, 2);
    const ord3 = orders.find((o) => o.id === 'ord_3');
    assert.strictEqual(ord3.customerId, 'existing_cust_ahmed');
  });

  // ── Item 2: Recalculate customer ratings ──────────────────────────────────
  test('Item 2: recalculates customer ratings for both old and new customers on --apply', async () => {
    const mockPrisma = createMockPrisma();
    const recalculatedCustomerIds = [];

    const mockRecalculateRating = async (customerId, companyId) => {
      assert.strictEqual(companyId, 'comp-100');
      recalculatedCustomerIds.push(customerId);
      return { success: true };
    };

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      outDir: tempDir,
      recalculateCustomerRating: mockRecalculateRating,
    });

    // 2 orders moved from cust_shared_1 to 2 new customers (new_cust_2, new_cust_3)
    // Total affected customers = 3 (1 old + 2 new)
    assert.strictEqual(report.customersRecalculated, 3);
    assert.strictEqual(report.recalcFailures, 0);
    assert.ok(recalculatedCustomerIds.includes('cust_shared_1'));
  });

  // ── Item 3: Dry-run projected metrics ─────────────────────────────────────
  test('Item 3: dry-run reports projected numbers and sharedCustomersAfter as number', async () => {
    const mockPrisma = createMockPrisma();

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: false,
      outDir: tempDir,
    });

    assert.strictEqual(typeof report.sharedBefore, 'number');
    assert.strictEqual(typeof report.sharedAfterProjected, 'number');
    assert.strictEqual(typeof report.sharedCustomersAfter, 'number');
    assert.strictEqual(report.sharedAfterProjected, 0);
    assert.strictEqual(report.sharedCustomersAfter, 0);
    assert.strictEqual(report.totalOrdersBefore, report.totalOrdersAfter);
  });

  // ── Item 4: Safety gate on --apply ─────────────────────────────────────────
  test('Item 4: --apply without --confirm-apply is rejected with exitCode 2', async () => {
    const mockPrisma = createMockPrisma();

    await assert.rejects(
      async () => {
        await repairSharedCustomers({
          prisma: mockPrisma,
          company: 'comp-100',
          apply: true,
          confirmApply: false,
        });
      },
      (err) => {
        assert.strictEqual(err.exitCode, 2);
        assert.ok(err.message.includes('--confirm-apply'));
        return true;
      }
    );
  });

  test('Item 4: --expect-host mismatch is rejected with exitCode 2', async () => {
    const mockPrisma = createMockPrisma();

    await assert.rejects(
      async () => {
        await repairSharedCustomers({
          prisma: mockPrisma,
          company: 'comp-100',
          apply: true,
          confirmApply: true,
          expectHost: 'prod-db-server.internal',
          outDir: tempDir,
        });
      },
      (err) => {
        assert.strictEqual(err.exitCode, 2);
        assert.ok(err.message.includes('Host mismatch'));
        return true;
      }
    );
  });

  // ── Item 5: Group-by name-phone vs phone ──────────────────────────────────
  test('Item 5: --group-by=name-phone creates separate customers for same phone with different names', async () => {
    // Add two orders with the SAME phone but DIFFERENT customer names
    orders.push({
      id: 'ord_name_1',
      companyId: 'comp-100',
      orderNumber: '105201',
      customerId: 'cust_shared_1',
      customerName: 'فاطمة أحمد',
      customerPhone: '01099998888',
      customer: customers[0],
    });
    orders.push({
      id: 'ord_name_2',
      companyId: 'comp-100',
      orderNumber: '105202',
      customerId: 'cust_shared_1',
      customerName: 'منى علي',
      customerPhone: '01099998888',
      customer: customers[0],
    });

    const mockPrisma = createMockPrisma();

    const reportNamePhone = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      groupBy: 'name-phone',
      outDir: tempDir,
    });

    // Both فاطمة and منى got their own customer created
    assert.ok(reportNamePhone.phoneNameConflicts >= 1);
    const fatmaOrder = orders.find((o) => o.id === 'ord_name_1');
    const monaOrder = orders.find((o) => o.id === 'ord_name_2');
    assert.notStrictEqual(fatmaOrder.customerId, monaOrder.customerId);
  });

  // ── Item 6: Rollback default output path & company isolation ──────────────
  test('Item 6: rollback file default output path is under _reports/ and enforces company isolation', async () => {
    const mockPrisma = createMockPrisma();

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
    });

    // Default output path is under _reports/
    assert.ok(report.rollbackFile.includes('_reports'));
    assert.ok(fs.existsSync(report.rollbackFile));

    // Rollback attempted with WRONG company fails with exitCode 2
    await assert.rejects(
      async () => {
        await executeRollback(mockPrisma, report.rollbackFile, 'comp-WRONG');
      },
      (err) => {
        assert.strictEqual(err.exitCode, 2);
        assert.ok(err.message.includes('Tenant safety check failed'));
        return true;
      }
    );

    // Clean up created file in _reports
    try {
      fs.unlinkSync(report.rollbackFile);
    } catch (_) {}
  });

  // ── Item 6: --sample-order parameter ──────────────────────────────────────
  test('Item 6: --sample-order parameter measures specific order before/after', async () => {
    const mockPrisma = createMockPrisma();

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      sampleOrder: '105102',
      outDir: tempDir,
    });

    assert.ok(report.sampleOrder);
    assert.strictEqual(report.sampleOrder.before.orderNumber, '105102');
    assert.strictEqual(report.sampleOrder.after.orderNumber, '105102');
  });

  // ── Item 7: sharedCustomersAfter is always number ─────────────────────────
  test('Item 7: sharedCustomersAfter is always a number in both dry-run and apply modes', async () => {
    const mockPrisma = createMockPrisma();

    const dryReport = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: false,
      outDir: tempDir,
    });
    assert.strictEqual(typeof dryReport.sharedCustomersAfter, 'number');

    const applyReport = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      confirmApply: true,
      outDir: tempDir,
    });
    assert.strictEqual(typeof applyReport.sharedCustomersAfter, 'number');
  });
});
