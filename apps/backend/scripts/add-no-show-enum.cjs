const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    await p.$executeRawUnsafe("ALTER TYPE education_session_status ADD VALUE IF NOT EXISTS 'NO_SHOW'");
    const rows = await p.$queryRawUnsafe(
      "SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'education_session_status' ORDER BY e.enumsortorder",
    );
    console.log('after:', JSON.stringify(rows.map((r) => r.enumlabel)));
  } catch (e) {
    console.log('ERR', e.message);
  } finally {
    await p.$disconnect();
  }
})();
