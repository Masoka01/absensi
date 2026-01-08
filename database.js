// File: supabase.js (ATAU ganti database.js)
const { Pool } = require('pg');

// Config dari Supabase Dashboard
const pool = new Pool({
  host: 'db.[your-project-ref].supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '[your-database-password]', // BUKAN password akun Supabase
  ssl: {
    rejectUnauthorized: false // Supabase butuh SSL
  },
  max: 10, // connection limit
  idleTimeoutMillis: 30000
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to Supabase:', err.message);
    console.log('\n💡 Tips:');
    console.log('1. Dapatkan password di: Supabase → Settings → Database');
    console.log('2. Format host: db.[project-ref].supabase.co');
    console.log('3. Port: 5432 (PostgreSQL)');
    return;
  }
  console.log('✅ BERHASIL terhubung ke Supabase PostgreSQL!');
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      console.error('Error executing query:', err.message);
    } else {
      console.log('Server time:', result.rows[0].now);
    }
  });
});

module.exports = pool;
