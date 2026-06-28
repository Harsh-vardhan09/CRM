import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function backfill() {
  console.log('Connecting via pg to run backfill...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`UPDATE "User" SET status = 'active' WHERE status = 'pending'`);
    console.log(`Successfully updated ${res.rowCount} users to active status.`);
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    await pool.end();
  }
}

backfill();
