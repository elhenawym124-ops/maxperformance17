const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const CID = 'cmwp4ot8p0000juzaeqeysfg3';
(async () => {
  try {
    const payroll = await p.payroll.groupBy({
      by: ['month', 'year', 'status'],
      where: { companyId: CID },
      _count: { id: true },
    }).catch(() => []);
    const wallet = await p.walletTransaction.findMany({
      where: { companyId: CID },
      select: { id: true, amount: true, status: true, type: true, createdAt: true },
      take: 10,
    }).catch(() => []);
    const sessions = await p.educationSession.groupBy({
      by: ['status'],
      where: { companyId: CID },
      _count: { id: true },
    }).catch(() => []);
    const tasks = await p.task.count({ where: { companyId: CID } }).catch(() => -1);
    const coupons = await p.coupon.count({ where: { companyId: CID } }).catch(() => -1);
    const notifUnread = await p.taskNotification.count({ where: { companyId: CID, isRead: false } }).catch(() => -1);
    console.log('PAYROLL', JSON.stringify(payroll));
    console.log('WALLET', JSON.stringify(wallet.map((w) => `${w.type}:${w.amount}:${w.status}`)));
    console.log('SESSIONS', JSON.stringify(sessions));
    console.log('TASKS', tasks, 'COUPONS', coupons, 'UNREAD_NOTIF', notifUnread);
  } catch (e) {
    console.log('ERR', e.message);
  } finally {
    await p.$disconnect();
  }
})();
