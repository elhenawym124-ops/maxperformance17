const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query("SELECT id, name, subdomain, settings FROM companies WHERE subdomain = 'swan'");
    if (res.rows.length) {
      const c = res.rows[0];
      console.log('Swan settings:', JSON.stringify(c.settings?.storefront?.settings?.conversionSettings || c.settings?.conversionSettings, null, 2));
    } else {
      console.log('Swan not found');
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

run();
