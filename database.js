// database.js - Untuk Supabase PostgreSQL
const { Pool } = require('pg');

// ⚠️ GANTI PASSWORD_DISINI dengan password dari Supabase!
const pool = new Pool({
  host: 'db.sjxdvukiaefydsihwydc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'password_kamu', // ← GANTI INI!
  ssl: {
    rejectUnauthorized: false // WAJIB ADA
  },
  max: 10,
  idleTimeoutMillis: 30000
});

// Fungsi koneksi biasa seperti MySQL
const db = {
  query: (text, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    return pool.query(text, params, callback);
  }
};

// Test connection saat startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ GAGAL konek ke Supabase:', err.message);
    console.log('\n💡 SOLUSI:');
    console.log('1. Buka: https://supabase.com/dashboard/project/sjxdvukiaefydsihwydc');
    console.log('2. Settings → Database → Connection String');
    console.log('3. Klik "Reveal" → copy password');
    console.log('4. Paste password di line 11 (ganti "password_kamu")');
    return;
  }
  
  console.log('✅ BERHASIL konek ke Supabase PostgreSQL!');
  
  // Cek apakah tabel kita ada
  client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN ('users', 'absensi')
  `, (err, result) => {
    release();
    
    if (err) {
      console.error('Error cek tabel:', err.message);
      return;
    }
    
    const tables = result.rows.map(r => r.table_name);
    console.log('📋 Tabel ditemukan:', tables.length > 0 ? tables.join(', ') : '(belum ada)');
    
    if (tables.length === 0) {
      console.log('⚠️  Tabel kosong! Run SQL di Supabase dulu:');
      console.log('   1. Buka SQL Editor');
      console.log('   2. Paste script SQL');
      console.log('   3. Klik "Run"');
    }
  });
});

module.exports = db;
