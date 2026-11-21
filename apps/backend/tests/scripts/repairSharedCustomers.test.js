/**
 * Tests for repair-shared-customers script (Task 791436c4):
 * 1. dry-run does not write anything to DB and produces report
 * 2. --apply creates rollback file and moves orders
 * 3. rerun is idempotent (0 orders moved, 0 duplicate customers)
 * 4. rollback restores orders to original customerId
 * 5. Case 1 (جديد): creates new customer for previously unseen phone
 * 6. Case 2 (نفس التليفون بصيغة مختلفة): matches existing customer with alternative format (+2010... vs 010...)
 * 7. Case 3 (مختلف): separates multiple distinct phones into distinct customers
 * 8. Batched processing & limit
 */

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
    return {
      order: {
        findMany: jest.fn(async ({ where }) => {
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
        }),
        count: jest.fn(async ({ where }) => {
          return orders.filter((o) => {
            if (where?.companyId && o.companyId !== where.companyId) return false;
            if (where?.customerId && o.customerId !== where.customerId) return false;
            return true;
          }).length;
        }),
        findFirst: jest.fn(async ({ where }) => {
          return orders.find((o) => {
            if (where?.companyId && o.companyId !== where.companyId) return false;
            if (where?.orderNumber && o.orderNumber !== where.orderNumber) return false;
            return true;
          }) || null;
        }),
        update: jest.fn(async ({ where, data }) => {
          const ord = orders.find((o) => o.id === where.id);
          if (ord) {
            ord.customerId = data.customerId;
          }
          return ord;
        }),
      },
      customer: {
        findMany: jest.fn(async ({ where }) => {
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
        }),
        findFirst: jest.fn(async ({ where }) => {
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
        }),
        create: jest.fn(async ({ data }) => {
          const newCust = {
            id: `new_cust_${customers.length + 1}`,
            ...data,
          };
          customers.push(newCust);
          return newCust;
        }),
      },
    };
  }

  test('dry-run does NOT write anything to database or disk', async () => {
    const mockPrisma = createMockPrisma();

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: false,
      outputDir: tempDir,
    });

    expect(report.apply).toBe(false);
    expect(report.totalOrdersBefore).toBe(4);
    expect(report.totalOrdersAfter).toBe(4);
    expect(report.ordersMoved).toBe(2); // ord_2 and ord_3 have different phones
    expect(report.newCustomersCreated).toBe(2);
    expect(report.skipped_no_phone).toBe(0);
    expect(report.rollbackFile).toBeNull();

    // Verify DB wasn't touched
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
    expect(mockPrisma.customer.create).not.toHaveBeenCalled();
    // Customer array should still only have 1 customer
    expect(customers.length).toBe(1);
  });

  test('--apply creates rollback file, creates customers, and updates orders', async () => {
    const mockPrisma = createMockPrisma();

    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      outputDir: tempDir,
    });

    expect(report.apply).toBe(true);
    expect(report.ordersMoved).toBe(2);
    expect(report.newCustomersCreated).toBe(2);
    expect(report.totalOrdersBefore).toBe(4);
    expect(report.totalOrdersAfter).toBe(4);
    expect(report.rollbackFile).toBeDefined();
    expect(fs.existsSync(report.rollbackFile)).toBe(true);

    // Verify rollback file content
    const rollbackContent = JSON.parse(fs.readFileSync(report.rollbackFile, 'utf8'));
    expect(rollbackContent.length).toBe(2);
    expect(rollbackContent[0].orderId).toBe('ord_2');
    expect(rollbackContent[0].oldCustomerId).toBe('cust_shared_1');
    expect(rollbackContent[0].newCustomerId).not.toBe('cust_shared_1');

    // Verify orders were updated in DB
    const ord2 = orders.find((o) => o.id === 'ord_2');
    expect(ord2.customerId).not.toBe('cust_shared_1');
    const ord1 = orders.find((o) => o.id === 'ord_1');
    expect(ord1.customerId).toBe('cust_shared_1'); // ord_1 had matching phone so stayed
  });

  test('idempotency: re-running --apply moves 0 orders and creates 0 duplicate customers', async () => {
    const mockPrisma = createMockPrisma();

    // First run
    await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      outputDir: tempDir,
    });

    const customersAfterFirstRun = customers.length;
    expect(customersAfterFirstRun).toBe(3); // original + 2 created

    // Second run
    const secondReport = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      outputDir: tempDir,
    });

    expect(secondReport.ordersMoved).toBe(0);
    expect(secondReport.newCustomersCreated).toBe(0);
    expect(customers.length).toBe(customersAfterFirstRun);
  });

  test('--rollback restores all orders to their original customerId', async () => {
    const mockPrisma = createMockPrisma();

    // Apply repair
    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      outputDir: tempDir,
    });

    expect(orders.find((o) => o.id === 'ord_2').customerId).not.toBe('cust_shared_1');

    // Execute rollback
    const rollbackResult = await executeRollback(mockPrisma, report.rollbackFile);
    expect(rollbackResult.rollback).toBe(true);
    expect(rollbackResult.totalOrdersRestored).toBe(2);

    // Verify all orders restored
    expect(orders.find((o) => o.id === 'ord_2').customerId).toBe('cust_shared_1');
    expect(orders.find((o) => o.id === 'ord_3').customerId).toBe('cust_shared_1');
  });

  // (الحالة ١: جديد) عميل جديد تماماً برقم جديد
  test('(Case 1: جديد) creates a new customer when order has a brand new phone', async () => {
    const mockPrisma = createMockPrisma();
    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      outputDir: tempDir,
    });

    expect(report.newCustomersCreated).toBeGreaterThanOrEqual(1);
    const ord2 = orders.find((o) => o.id === 'ord_2');
    const createdCust = customers.find((c) => c.id === ord2.customerId);
    expect(createdCust).toBeDefined();
    expect(createdCust.phoneNormalized).toBe('+201153770958');
  });

  // (الحالة ٢: نفس التليفون بصيغة مختلفة) مطابقة نفس العميل برقم بصيغة مختلفة
  test('(Case 2: نفس التليفون بصيغة مختلفة) links to existing customer when phone matches in different format', async () => {
    // Add existing customer with canonical +201153770958
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

    // ord_2 (phone: 01153770958) should link to cust_existing_noha without creating a duplicate
    const ord2 = orders.find((o) => o.id === 'ord_2');
    expect(ord2.customerId).toBe('cust_existing_noha');
    // Only ord_3 needed a new customer
    expect(report.newCustomersCreated).toBe(1);
  });

  // (الحالة ٣: مختلف) فصل طلبين برقمين مختلفين تحت عميل مشترك إلى عميلين منفصلين
  test('(Case 3: مختلف) separates orders with distinct phones into distinct customers', async () => {
    const mockPrisma = createMockPrisma();
    await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: true,
      outputDir: tempDir,
    });

    const ord1 = orders.find((o) => o.id === 'ord_1'); // 01284640768 (kept with cust_shared_1)
    const ord2 = orders.find((o) => o.id === 'ord_2'); // 01153770958
    const ord3 = orders.find((o) => o.id === 'ord_3'); // 01222710584

    expect(ord1.customerId).not.toBe(ord2.customerId);
    expect(ord2.customerId).not.toBe(ord3.customerId);
    expect(ord1.customerId).not.toBe(ord3.customerId);
  });

  // اختبار التقسيم على دفعات (Batching)
  test('batching: processes in batches according to batchSize and respects limit', async () => {
    const mockPrisma = createMockPrisma();
    const report = await repairSharedCustomers({
      prisma: mockPrisma,
      company: 'comp-100',
      apply: false,
      batch: 1,
      limit: 1,
      outputDir: tempDir,
    });

    expect(report.batchSize).toBe(1);
    expect(report.limit).toBe(1);
    expect(report.ordersMoved).toBe(2);
    expect(report.sharedBefore).toBeDefined();
    expect(report.ordersTotalBefore).toBe(4);
    expect(report.affectedRows).toBe(2);
  });
});
