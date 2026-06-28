const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres.xgkeirwnylurtngmykii:netmeds72007@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true' });

async function run() {
  console.log('Running backfill raw...');
  try {
    const r = await pool.query('UPDATE "User" SET status = \'active\' WHERE status = \'pending\'');
    console.log(r.rowCount, 'users updated');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
