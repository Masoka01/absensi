const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "admin",
  password: "Mayoni_8829", // Password yang benar
  database: "absensi_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0, // BENAR: queueLimit, BUKAN quenelimit
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error koneksi database:", err.code);
    console.log("\n💡 SOLUSI:");
    console.log("1. Coba login dengan: mysql -u admin -pMayoni_8829");
    console.log("2. Jika gagal, reset password admin:");
    console.log("   sudo mysql");
    console.log(
      "   ALTER USER 'admin'@'localhost' IDENTIFIED BY 'Mayoni_8829';"
    );
    console.log("   FLUSH PRIVILEGES;");
    return;
  }
  console.log("✅ BERHASIL terhubung ke MySQL sebagai: admin");
  console.log("   Database: absensi_db");
  console.log("   Status: Connected");
});

// Handle connection errors
db.on("error", (err) => {
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("⚠️  Koneksi database terputus, mencoba reconnect...");
    db.connect();
  } else {
    console.error("Database error:", err.message);
  }
});

module.exports = db;
