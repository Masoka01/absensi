const bcrypt = require("bcryptjs");
const db = require("./database");

// List user yang akan dibuat
const users = [
  { username: "hrd", password: "882909", role: "admin" },
  { username: "mitra", password: "dancok", role: "user" },
];

async function createUsers() {
  console.log("🔄 Mulai membuat user...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      // Hash password dengan bcrypt
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Cek dulu apakah user sudah ada
      const checkSql = "SELECT * FROM users WHERE username = ?";
      db.query(checkSql, [user.username], async (err, results) => {
        if (err) {
          console.log(`❌ Error checking user ${user.username}:`, err.message);
          errorCount++;
          return;
        }

        if (results.length > 0) {
          console.log(`⚠️  User ${user.username} sudah ada, skip...`);
          successCount++;
          return;
        }

        // Insert user baru
        const insertSql =
          "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
        db.query(
          insertSql,
          [user.username, hashedPassword, user.role],
          (err) => {
            if (err) {
              console.log(
                `❌ Error creating user ${user.username}:`,
                err.message
              );
              errorCount++;
            } else {
              console.log(
                `✅ User ${user.username} (role: ${user.role}) created`
              );
              console.log(`   Username: ${user.username}`);
              console.log(
                `   Password: ${user.password} (plain text untuk testing)`
              );
              console.log(
                `   Password Hash: ${hashedPassword.substring(0, 20)}...\n`
              );
              successCount++;
            }

            // Cek jika semua proses selesai
            if (successCount + errorCount === users.length) {
              console.log("\n📊 ====== HASIL ======");
              console.log(`✅ Berhasil: ${successCount} user`);
              console.log(`❌ Gagal: ${errorCount} user`);
              console.log(`📋 Total: ${users.length} user`);
              console.log("\n🔑 INFO LOGIN:");
              console.log("HRD: username=hrd, password=admin123");
              console.log(
                "Mitra: username=mitra1/mitra2/mitra3, password=mitra123"
              );
              console.log(
                "Karyawan: username=karyawan1/karyawan2, password=password123"
              );
              console.log("Staff: username=staff1/staff2, password=staff123");
              console.log("\n🚀 Script selesai!");

              // Tunggu 2 detik baru exit
              setTimeout(() => {
                process.exit(0);
              }, 2000);
            }
          }
        );
      });
    } catch (error) {
      console.log(`❌ Error processing user ${user.username}:`, error.message);
      errorCount++;
    }
  }
}

// Pastikan ada delay sebelum menutup koneksi
process.on("exit", () => {
  console.log("\n👋 Keluar dari script...");
});

// Tangani Ctrl+C
process.on("SIGINT", () => {
  console.log("\n\n⏹️  Script dihentikan oleh user");
  process.exit(0);
});

// Jalankan script
console.log("🚀 Starting user creation script...");
createUsers();
