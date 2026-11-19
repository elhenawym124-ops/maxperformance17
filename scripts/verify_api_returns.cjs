const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const returnController = require('./controller/returnController');

async function test() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt';
  const req = {
    user: { companyId, effectiveCompanyId: companyId, id: 'cmleybpg2002bjuo2m44y4kip' },
    query: { isReviewed: 'false', page: '1', limit: '20' }
  };
  const res = {
    json: (result) => {
      console.log('✅ API returned total unreviewed count:', result.total);
      console.log('✅ First 3 items:', result.data.slice(0, 3).map(r => ({ orderNumber: r.order?.orderNumber, date: r.order?.createdAt })));
    },
    status: (code) => ({
      json: (err) => console.error('Error status:', code, err)
    })
  };

  await returnController.getReturnRequests(req, res);

  const pendingInDb = await prisma.returnRequest.count({
    where: { companyId, isReviewed: false }
  });
  console.log('✅ Total pending in DB after API call:', pendingInDb);
}

test().catch(console.error).finally(() => prisma.$disconnect());
