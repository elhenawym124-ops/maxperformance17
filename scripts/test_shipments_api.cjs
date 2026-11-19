const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('/var/www/backend2/node_modules/jsonwebtoken');
const axios = require('/var/www/backend2/node_modules/axios');

const REDLINE_COMPANY_ID = 'cmu5iix000aa6juwmmqcrls8i';

async function main() {
  const user = await prisma.user.findFirst({
    where: { companyId: REDLINE_COMPANY_ID },
    select: { id: true, email: true, role: true, companyId: true },
  });

  if (!user) {
    console.error('No admin user found for Red Line');
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );

  console.log(`🔑 Generated token for user ${user.email}`);

  // Test GET /api/v1/shipments?status=processing&page=1
  const t0 = Date.now();
  const res = await axios.get('http://localhost:3007/api/v1/shipments?status=processing&page=1', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const elapsed = Date.now() - t0;

  console.log(`⚡ GET /api/v1/shipments response time: ${elapsed}ms`);
  console.log(`📦 Status: ${res.status}`);
  console.log(`📋 Total Shipments Matching "processing":`, res.data.pagination?.total);
  console.log('📊 Summary Carrier Status Counts:');
  console.table(res.data.summary?.carrierStatusCounts);
}

main()
  .catch(e => console.error('Error:', e.response?.data || e.message))
  .finally(() => prisma.$disconnect());
