/**
 * Standalone Test Runner for WooCommerce Customer Matching (Task 791436c4)
 * Verifies:
 *   Case 1 (جديد): creates a new customer when phone is new and does not link to shared store email customer
 *   Case 2 (نفس التليفون بصيغة مختلفة): matches the same existing customer across different phone number formats (+2010... / 2010... / 010...)
 *   Case 3 (مختلف): creates two distinct customers for two orders with same shared email but different phones
 *   Case 4 (إيميل فقط): matches an existing customer with the same email when the customer has no phone
 */

const assert = require('assert');
const {
  findOrCreateCustomer,
  createNewOrderOptimized,
} = require('../../services/wooCommerceImportService');
const { toCanonicalE164 } = require('../../utils/phoneNormalization');

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

function createSetup() {
  let customers = [];
  let nextId = 1;

  function createMockPrisma() {
    return {
      customer: {
        findFirst: async ({ where }) => {
          return customers.find((c) => {
            if (where.companyId && c.companyId !== where.companyId) return false;
            if (where.id && c.id !== where.id) return false;
            if (where.email && c.email?.toLowerCase() !== where.email?.toLowerCase()) return false;
            if (where.phone && c.phone !== where.phone) return false;
            if (where.phoneNormalized && c.phoneNormalized !== where.phoneNormalized) return false;
            if (where.OR) {
              const matchesOr = where.OR.some((cond) => {
                if (cond.phoneNormalized && c.phoneNormalized === cond.phoneNormalized) return true;
                if (cond.phone && typeof cond.phone === 'object' && cond.phone.in) {
                  return cond.phone.in.includes(c.phone) || cond.phone.in.includes(c.phoneNormalized);
                }
                if (cond.phone && c.phone === cond.phone) return true;
                if (cond.email && c.email?.toLowerCase() === cond.email?.toLowerCase()) return true;
                return false;
              });
              if (!matchesOr) return false;
            }
            return true;
          }) || null;
        },
        create: async ({ data }) => {
          const newCust = {
            id: `cust_${nextId++}`,
            companyId: data.companyId || data.company?.connect?.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || null,
            phone: data.phone || null,
            phoneNormalized: data.phoneNormalized || toCanonicalE164(data.phone),
            notes: data.notes || '',
            status: data.status || 'ACTIVE',
          };
          customers.push(newCust);
          return newCust;
        },
      },
      order: {
        findFirst: async () => null,
        create: async ({ data }) => ({
          id: `ord_${nextId++}`,
          ...data,
        }),
      },
      orderStatusHistory: {
        create: async () => ({}),
      },
    };
  }

  return { customers, createMockPrisma };
}

async function main() {
  console.log('\n======================================================');
  console.log('🧪 Running Suite: WooCommerce Customer Matching Cases (Task 791436c4)');
  console.log('======================================================\n');

  // Case 1: جديد
  await runTest('(Case 1: جديد) creates a new customer when phone is new and does not link to shared store email customer', async () => {
    const { customers, createMockPrisma } = createSetup();
    const prisma = createMockPrisma();
    const companyId = 'company-swan';

    // Existing shared store customer (loliali with own phone)
    customers.push({
      id: 'cust_shared_loliali',
      companyId,
      firstName: 'الحميراء',
      lastName: 'محمد',
      phone: '01284640768',
      phoneNormalized: '+201284640768',
      email: 'loliali5555555555@gmail.com',
    });

    // New incoming order: Noha with different phone and shared email
    const orderData = {
      customerName: 'نهى سامي محمد',
      customerPhone: '01153770958',
      customerEmail: 'loliali5555555555@gmail.com',
    };

    const customerId = await findOrCreateCustomer(prisma, companyId, orderData);

    assert.notStrictEqual(customerId, 'cust_shared_loliali');
    const newCustomer = customers.find((c) => c.id === customerId);
    assert.ok(newCustomer);
    assert.strictEqual(newCustomer.phoneNormalized, '+201153770958');
    assert.strictEqual(newCustomer.firstName, 'نهى');
  });

  // Case 2: نفس التليفون بصيغة مختلفة
  await runTest('(Case 2: نفس التليفون بصيغة مختلفة) matches the same existing customer across different phone number formats', async () => {
    const { customers, createMockPrisma } = createSetup();
    const prisma = createMockPrisma();
    const companyId = 'company-swan';

    // Existing customer with canonical +201012345678 and local 01012345678
    customers.push({
      id: 'cust_target_ahmed',
      companyId,
      firstName: 'أحمد',
      lastName: 'محمود',
      phone: '01012345678',
      phoneNormalized: '+201012345678',
      email: 'ahmed@gmail.com',
    });

    const formats = ['+201012345678', '201012345678', '01012345678'];

    for (const phoneFormat of formats) {
      const orderData = {
        customerName: 'أحمد محمود',
        customerPhone: phoneFormat,
        customerEmail: 'ahmed@gmail.com',
      };

      const customerId = await findOrCreateCustomer(prisma, companyId, orderData);
      assert.strictEqual(customerId, 'cust_target_ahmed');
    }

    // No new customer was created
    assert.strictEqual(customers.length, 1);
  });

  // Case 3: مختلف
  await runTest('(Case 3: مختلف) creates two distinct customers for two orders with same shared email but different phones', async () => {
    const { customers, createMockPrisma } = createSetup();
    const prisma = createMockPrisma();
    const companyId = 'company-swan';

    const order1 = {
      customerName: 'أحمد شريف',
      customerPhone: '01222710584',
      customerEmail: 'loliali5555555555@gmail.com',
    };

    const order2 = {
      customerName: 'سلمي علام',
      customerPhone: '01019091110',
      customerEmail: 'loliali5555555555@gmail.com',
    };

    const cust1Id = await findOrCreateCustomer(prisma, companyId, order1);
    const cust2Id = await findOrCreateCustomer(prisma, companyId, order2);

    assert.notStrictEqual(cust1Id, cust2Id);
    assert.strictEqual(customers.length, 2);

    // Also test batch lookups behavior in createNewOrderOptimized
    const lookups = {
      orders: new Map(),
      customers: new Map(),
      products: new Map(),
      variants: new Map(),
    };

    const batchOrder1 = {
      orderNumber: 'WOO-76761',
      customerName: 'أحمد شريف',
      customerPhone: '01222710584',
      customerEmail: 'loliali5555555555@gmail.com',
    };

    const batchOrder2 = {
      orderNumber: 'WOO-76808',
      customerName: 'سلمي علام',
      customerPhone: '01019091110',
      customerEmail: 'loliali5555555555@gmail.com',
    };

    const res1 = await createNewOrderOptimized(prisma, companyId, batchOrder1, null, 'user', lookups);
    const res2 = await createNewOrderOptimized(prisma, companyId, batchOrder2, null, 'user', lookups);

    assert.ok(res1.order.customerId);
    assert.ok(res2.order.customerId);
    assert.notStrictEqual(res1.order.customerId, res2.order.customerId);
  });

  // Case 4: إيميل فقط
  await runTest('(Case 4: إيميل فقط) matches an existing customer with the same email when the customer has no phone', async () => {
    const { customers, createMockPrisma } = createSetup();
    const prisma = createMockPrisma();
    const companyId = 'company-swan';

    customers.push({
      id: 'cust_email_only',
      companyId,
      firstName: 'عميل',
      lastName: 'المتجر',
      phone: null,
      phoneNormalized: null,
      email: 'online-buyer@example.com',
    });

    const incomingOrder = {
      customerName: 'عميل المتجر',
      customerPhone: null,
      customerEmail: 'online-buyer@example.com',
    };

    const customerId = await findOrCreateCustomer(prisma, companyId, incomingOrder);

    assert.strictEqual(customerId, 'cust_email_only');
    assert.strictEqual(customers.length, 1);
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
