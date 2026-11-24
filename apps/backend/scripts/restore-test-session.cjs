const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const id = 'cmwp4s9dm001pjul2wt89rivz';
    const s = await p.educationSession.update({
      where: { id },
      data: { status: 'SCHEDULED', notes: null },
      select: { id: true, status: true },
    });
    console.log('restored', JSON.stringify(s));
  } catch (e) {
    console.log('ERR', e.message);
  } finally {
    await p.$disconnect();
  }
})();
