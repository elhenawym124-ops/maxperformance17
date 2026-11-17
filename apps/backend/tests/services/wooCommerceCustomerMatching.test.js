/**
 * Tests for WooCommerce customer matching logic:
 * 1. New customer with unique phone -> creates new customer (doesn't link to shared email customer)
 * 2. Same phone with different formats (+2010... / 2010... / 010...) -> matches SAME customer
 * 3. Two different customers with same shared email -> TWO different customers (regression test)
 * 4. Existing customer with same email and NO phone -> links to that customer
 */

const {
  findOrCreateCustomer,
  createNewOrderOptimized,
} = require('../../services/wooCommerceImportService');
const { toCanonicalE164, getPhoneVariants } = require('../../utils/phoneNormalization');

describe('WooCommerce Customer Matching (Task 791436c4)', () => {
  let customers = [];
  let nextId = 1;

  function createMockPrisma() {
    return {
      customer: {
        findFirst: jest.fn(async ({ where }) => {
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
        }),
        create: jest.fn(async ({ data }) => {
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
        }),
      },
      order: {
        findFirst: jest.fn(async () => null),
        create: jest.fn(async ({ data }) => ({
          id: `ord_${nextId++}`,
          ...data,
        })),
      },
      orderStatusHistory: {
        create: jest.fn(async () => ({})),
      },
    };
  }

  beforeEach(() => {
    customers = [];
    nextId = 1;
  });

  // (١) عميل جديد تمامًا (تليفون جديد) → عميل جديد، ومش بيربط بعميل الإيميل المشترك
  test('(1) creates a new customer when phone is new and does not link to shared store email customer', async () => {
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

    expect(customerId).not.toBe('cust_shared_loliali');
    const newCustomer = customers.find((c) => c.id === customerId);
    expect(newCustomer).toBeDefined();
    expect(newCustomer.phoneNormalized).toBe('+201153770958');
    expect(newCustomer.firstName).toBe('نهى');
  });

  // (٢) نفس التليفون بصيغة مختلفة (+201012345678 / 201012345678 / 01012345678) → نفس العميل
  test('(2) matches the same existing customer across different phone number formats', async () => {
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
      expect(customerId).toBe('cust_target_ahmed');
    }

    // No new customer was created
    expect(customers.length).toBe(1);
  });

  // (٣) عميل مختلف تمامًا بنفس الإيميل المشترك → عميلين مختلفين (regression للبج)
  test('(3) creates two distinct customers for two orders with same shared email but different phones', async () => {
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

    // Sequential findOrCreateCustomer
    const cust1Id = await findOrCreateCustomer(prisma, companyId, order1);
    const cust2Id = await findOrCreateCustomer(prisma, companyId, order2);

    expect(cust1Id).not.toBe(cust2Id);
    expect(customers.length).toBe(2);

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

    expect(res1.order.customerId).toBeDefined();
    expect(res2.order.customerId).toBeDefined();
    expect(res1.order.customerId).not.toBe(res2.order.customerId);
  });

  // (٤) عميل موجود بنفس الإيميل وبلا تليفون → يجوز الربط بيه
  test('(4) matches an existing customer with the same email when the customer has no phone', async () => {
    const prisma = createMockPrisma();
    const companyId = 'company-swan';

    // Existing customer created from web checkout with email only and no phone
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

    expect(customerId).toBe('cust_email_only');
    expect(customers.length).toBe(1);
  });
});
