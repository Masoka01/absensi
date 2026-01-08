// test-supabase.js
const db = require('./database.js');

console.log('🚀 Testing Supabase Connection...\n');

// Tunggu 2 detik biar koneksi test selesai
setTimeout(() => {
  console.log('\n🧪 Testing queries...');
  
  // Test 1: Select data
  db.query('SELECT * FROM users LIMIT 3', (err, result) => {
    if (err) {
      console.log('❌ Query error:', err.message);
      console.log('\n💡 Tips:');
      console.log('1. Pastikan sudah run SQL di Supabase SQL Editor');
      console.log('2. Password sudah benar di database.js');
      return;
    }
    
    console.log('✅ Users found:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('   First user:', result.rows[0].username);
    }
    
    // Test 2: Insert data (jika perlu)
    db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      ['test_user', 'test123'],
      (err, result) => {
        if (!err) {
          console.log('✅ Insert test berhasil, ID:', result.rows[0].id);
        }
      }
    );
  });
}, 2000);
