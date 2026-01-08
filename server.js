const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./database");

const app = express();

// ========== MIDDLEWARE ==========
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "absensi-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Inject user ke views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ========== AUTH MIDDLEWARE ==========
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

const requireMitra = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "user") {
    return res.status(403).render("error", {
      title: "Akses Ditolak",
      message: "Hanya akun mitra (role: user) yang bisa mengakses halaman ini.",
    });
  }
  next();
};

const requireHRD = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).render("error", {
      title: "Akses Ditolak",
      message: "Hanya HRD (role: admin) yang bisa mengakses halaman ini.",
    });
  }
  next();
};

// ========== ROUTES ==========

// ----- PUBLIC ROUTES -----

// Home
app.get("/", (req, res) => {
  res.render("index", { title: "Absensi Digital" });
});

// Login
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("login", { title: "Login", error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah",
      });
    }

    const user = results[0];

    // Simple password check (plain text)
    if (password !== user.password) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah",
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    res.redirect("/");
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ----- MITRA ROUTES (Check-in, Izin, Check-out) -----

// Check-in (HANYA MITRA - role: user)
app.get("/checkin", requireMitra, (req, res) => {
  res.render("checkin", {
    title: "Check-in Karyawan",
    username: req.session.user.username,
  });
});

app.post("/checkin", requireMitra, (req, res) => {
  const nama = req.session.user.username;
  const tanggal = new Date().toISOString().split("T")[0];
  const jam_masuk = new Date().toTimeString().slice(0, 8);

  const sql =
    'INSERT INTO absensi (nama, tanggal, jam_masuk, status) VALUES (?, ?, ?, "hadir")';
  db.query(sql, [nama, tanggal, jam_masuk], (err) => {
    if (err) {
      console.error(err);
      res.send("Error menyimpan check-in");
      return;
    }
    res.redirect("/");
  });
});

// Izin/Sakit (HANYA MITRA - role: user)
app.get("/izin", requireMitra, (req, res) => {
  res.render("izin", {
    title: "Form Izin / Sakit",
    username: req.session.user.username,
  });
});

app.post("/izin", requireMitra, (req, res) => {
  const nama = req.session.user.username;
  const tanggal = new Date().toISOString().split("T")[0];
  const { status, keterangan } = req.body;

  const sql =
    'INSERT INTO absensi (nama, tanggal, status, jam_masuk, keterangan) VALUES (?, ?, ?, "00:00:00", ?)';
  db.query(sql, [nama, tanggal, status, keterangan], (err) => {
    if (err) {
      console.error(err);
      res.send("Error menyimpan izin/sakit");
      return;
    }
    res.redirect("/");
  });
});

// Check-out (HANYA MITRA - role: user)
app.get("/checkout", requireMitra, (req, res) => {
  const sql =
    'SELECT * FROM absensi WHERE jam_keluar IS NULL AND status = "hadir" ORDER BY tanggal DESC, id DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.send("Error mengambil data");
      return;
    }
    res.render("checkout", {
      title: "Check-out Karyawan",
      data: results,
    });
  });
});

app.post("/checkout/:id", requireMitra, (req, res) => {
  const jam_keluar = new Date().toTimeString().slice(0, 8);
  const sql = "UPDATE absensi SET jam_keluar = ? WHERE id = ?";
  db.query(sql, [jam_keluar, req.params.id], (err) => {
    if (err) {
      console.error(err);
      res.send("Error update check-out");
      return;
    }
    res.redirect("/checkout");
  });
});

// ----- HRD ROUTES (Laporan saja) -----

// Laporan (HANYA HRD - role: admin)
app.get("/laporan", requireHRD, (req, res) => {
  const sql = "SELECT * FROM absensi ORDER BY tanggal DESC, id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.send("Error mengambil data");
      return;
    }
    res.render("laporan", {
      title: "Laporan Absensi",
      data: results,
    });
  });
});

// Delete (HANYA HRD - role: admin)
app.get("/delete/:id", requireHRD, (req, res) => {
  const sql = "DELETE FROM absensi WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      console.error(err);
      res.send("Error menghapus data");
      return;
    }
    res.redirect("/laporan");
  });
});

// API Statistik (public)
app.get("/api/stats", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const sql = `
        SELECT 
            SUM(status = 'hadir') AS hadir,
            SUM(status = 'izin') AS izin,
            SUM(status = 'sakit') AS sakit
        FROM absensi 
        WHERE tanggal = ?
    `;
  db.query(sql, [today], (err, results) => {
    if (err) {
      res.json({ hadir: 0, izin: 0, sakit: 0 });
    } else {
      res.json(results[0] || { hadir: 0, izin: 0, sakit: 0 });
    }
  });
});

// Error page
app.get("/error", (req, res) => {
  res.render("error", {
    title: "Error",
    message: req.query.message || "Terjadi kesalahan.",
  });
});

// ========== START SERVER ==========
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
