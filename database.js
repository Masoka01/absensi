// database.js - UNTUK SUPABASE
const { Pool } = require('pg');

// ⚠️ GANTI [YOUR-PASSWORD] DENGAN PASSWORD KAMU!
const connectionString = 'postgresql://postgres:Mayoni_8829@db.sjxdvukiaefydsihwydc.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // WAJIB UNTUK SUPABASE!
  }
});

// Buat interface mirip mysql2
const db = {
  query: function(sql, params, callback) {
    // Jika params adalah callback (tanpa parameter)
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    console.log('📤 Executing:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    
    return pool.query(sql, params, (err, result) => {
      if (err) {
        console.error('❌ Database Error:', err.message);
      }
      if (callback) {
        callback(err, result);
      }
    });
  },
  
  // Untuk async/await
  queryAsync: function(sql, params) {
    return pool.query(sql, params);
  }
};

// Test otomatis saat aplikasi start
setTimeout(() => {
  db.query('SELECT NOW() as waktu', (err, result) => {
    if (err) {
      console.log('\n❌ DATABASE ERROR!');
      console.log('Pesan:', err.message);
      console.log('\n💡 SOLUSI:');
      console.log('1. GANTI [YOUR-PASSWORD] di line 7');
      console.log('2. Contoh: postgresql://postgres:Mayoni_8829@db.sjxdvukiaefydsihwydc.supabase.co:5432/postgres');
      console.log('3. Save file dan coba lagi');
    } else {
      console.log('✅ SUPABASE CONNECTED!');
      console.log('   Server time:', result.rows[0].waktu);
      
      // Cek apakah tabel kita ada
      db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`, 
        (err, result) => {
          if (!err) {
            const tables = result.rows.map(r => r.table_name);
            console.log('📋 Tables:', tables.length > 0 ? tables.join(', ') : 'No tables yet');
          }
        }
      );
    }
  });
}, 1500);

module.exports = db;
