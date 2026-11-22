const { describe, it: test } = require('node:test');
const assert = require('node:assert');
const { phoneFields, buildPhoneWhere, findCustomerByPhone, createCustomerByPhone } = require('../../utils/customerIdentity');

describe('customerIdentity', () => {
  test('phoneFields writes canonical phoneNormalized for any format', () => {
    assert.deepStrictEqual(phoneFields('01019046551'), {
      phone: '01019046551',
      phoneNormalized: '+201019046551',
    });
    assert.strictEqual(phoneFields('201019046551').phoneNormalized, '+201019046551');
    assert.deepStrictEqual(phoneFields(null), { phone: null, phoneNormalized: null });
  });

  test('buildPhoneWhere returns OR across canonical + variants', () => {
    const where = buildPhoneWhere('01019046551', 'company-1');
    assert.strictEqual(where.companyId, 'company-1');
    assert.deepStrictEqual(where.OR[0], { phoneNormalized: '+201019046551' });
    const inVariants = where.OR[1].phone.in;
    assert.ok(inVariants.includes('01019046551'));
    assert.ok(inVariants.includes('1019046551'));
    assert.ok(inVariants.includes('201019046551'));
  });

  test('buildPhoneWhere returns null for empty phone', () => {
    assert.strictEqual(buildPhoneWhere('', 'company-1'), null);
    assert.strictEqual(buildPhoneWhere(null, 'company-1'), null);
  });

  test('findCustomerByPhone queries the canonical or raw phone', async () => {
    let called = false;
    const mockPrisma = {
      customer: {
        findFirst: async () => {
          called = true;
          return { id: 'c1' };
        },
      },
    };
    const result = await findCustomerByPhone(mockPrisma, '01019046551', 'company-1');
    assert.strictEqual(result.id, 'c1');
    assert.ok(called);
  });

  test('Item 7(b): P2002 email fallback throws error and does NOT return customer with different phone', async () => {
    const p2002Error = new Error('Unique constraint failed on the fields: (`email`)');
    p2002Error.code = 'P2002';

    const mockPrisma = {
      customer: {
        create: async () => {
          throw p2002Error;
        },
        findFirst: async ({ where }) => {
          // Existing customer has the same email but a DIFFERENT phone
          if (where.email === 'shared@store.com') {
            return {
              id: 'cust-store-owner',
              email: 'shared@store.com',
              phone: '01222222222',
              phoneNormalized: '+20122222222',
            };
          }
          return null;
        },
      },
    };

    // Attempt to create customer with phone 01153770958 and shared email
    await assert.rejects(
      async () => {
        await createCustomerByPhone(mockPrisma, {
          companyId: 'comp-1',
          phone: null,
          data: {
            email: 'shared@store.com',
            phone: '01153770958',
          },
        });
      },
      (err) => {
        assert.strictEqual(err.code, 'P2002');
        return true;
      }
    );
  });

  test('Item 7(b): P2002 email fallback returns customer if existing customer has no phone', async () => {
    const p2002Error = new Error('Unique constraint failed on the fields: (`email`)');
    p2002Error.code = 'P2002';

    const mockPrisma = {
      customer: {
        create: async () => {
          throw p2002Error;
        },
        findFirst: async ({ where }) => {
          // Existing customer has the same email and NO phone
          if (where.email === 'unique-shopper@domain.com') {
            return {
              id: 'cust-no-phone',
              email: 'unique-shopper@domain.com',
              phone: null,
              phoneNormalized: null,
            };
          }
          return null;
        },
      },
    };

    const result = await createCustomerByPhone(mockPrisma, {
      companyId: 'comp-1',
      phone: null,
      data: {
        email: 'unique-shopper@domain.com',
      },
    });

    assert.strictEqual(result.id, 'cust-no-phone');
  });
});
