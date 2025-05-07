import pg from 'pg';
const { Pool } = pg;

async function checkDatabase() {
  try {
    // Create a connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Check if tables exist
    const tablesQuery = "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'";
    const tables = await pool.query(tablesQuery);
    console.log('Database tables:', tables.rows.map(row => row.tablename));

    // Check if job_listings table exists and has records
    if (tables.rows.some(row => row.tablename === 'job_listings')) {
      const countQuery = 'SELECT COUNT(*) FROM job_listings';
      const countResult = await pool.query(countQuery);
      console.log('Total job listings:', countResult.rows[0].count);
    } else {
      console.log('job_listings table does not exist');
    }

    await pool.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkDatabase(); 