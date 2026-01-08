const { Pool } = require('pg');
require('dotenv').config();

// Pool configuration untuk Supabase
const pool = new Pool({
  host: 'db.sjxdvukiaefydsihwydc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD, // Simpan di .env
  ssl: {
    rejectUnauthorized: false // WAJIB untuk Supabase
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Test connection function
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ SUCCESS: Connected to Supabase PostgreSQL!');
    
    // Cek database
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version.split(',')[0]);
    
    // Cek tabel kita
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tables.rows.length);
    tables.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ ERROR connecting to Supabase:');
    console.error('Message:', error.message);
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Cek password di: Supabase → Settings → Database');
    console.log('2. Buka file .env, pastikan DB_PASSWORD benar');
    console.log('3. Enable SSL di kode (rejectUnauthorized: false)');
  } finally {
    if (client) client.release();
  }
}

// Jalankan test saat development
if (process.env.NODE_ENV !== 'production') {
  testConnection();
}

// Handle pool events
pool.on('connect', () => {
  console.log('🟢 New client connected to Supabase');
});

pool.on('error', (err) => {
  console.error('🔴 PostgreSQL Pool Error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection
};
