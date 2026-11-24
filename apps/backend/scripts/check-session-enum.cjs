const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const rows = await p.$queryRawUnsafe(
      "SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'education_session_status' ORDER BY e.enumsortorder",
    );
    console.log('enum values:', JSON.stringify(rows.map((r) => r.enumlabel)));
    const counts = await p.$queryRawUnsafe(
      'SELECT status, COUNT(*)::int AS c FROM education_sessions GROUP BY status ORDER BY c DESC',
    );
    console.log('session statuses in use:', JSON.stringify(counts));
  } catch (e) {
    console.log('ERR', e.message);
  } finally {
    await p.$disconnect();
  }
})();
