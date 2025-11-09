const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/betcha' });

const runMigrations = async () => {
  try {
    const migPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
    if (fs.existsSync(migPath)) {
      const sql = fs.readFileSync(migPath, 'utf8');
      await pool.query(sql);
      console.log('Migrations applied');
    } else {
      console.log('No migrations found');
    }
  } catch (err) {
    console.error('Migration error', err.message);
  }
};

module.exports = { pool, runMigrations };
