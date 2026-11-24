const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const CID = 'cmwp4ot8p0000juzaeqeysfg3';
(async () => {
  try {
    const rows = await p.facebookCampaign.findMany({
      where: { companyId: CID },
      select: { id: true, name: true, status: true, adAccountId: true, objective: true, createdAt: true },
    });
    console.log('facebookCampaign rows:', JSON.stringify(rows, null, 1).slice(0, 1200));
    const accounts = await p.facebookAdAccount?.findMany?.({ where: { companyId: CID }, select: { id: true, accountId: true, name: true } }).catch(() => null);
    console.log('ad accounts:', JSON.stringify(accounts));
  } catch (e) {
    console.log('ERR', e.message);
  } finally {
    await p.$disconnect();
  }
})();
