require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./database");

const app = express();

// ========== MIDDLEWARE ==========
app.use(express.json());

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
  if (!req.session.user) return res.redirect("/login");
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

// Home
app.get("/", (req, res) => {
  res.render("index", { title: "Absensi Digital" });
});

// Login
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("login", { title: "Login", error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (results.length === 0 || password !== results[0].password) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah",
      });
    }

    const user = results[0];

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("login", {
      title: "Login",
      error: "Terjadi kesalahan server",
    });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ----- MITRA -----

app.get("/checkin", requireMitra, (req, res) => {
  res.render("checkin", {
    title: "Check-in Karyawan",
    username: req.session.user.username,
  });
});

app.post("/checkin", requireMitra, async (req, res) => {
  const nama = req.session.user.username;
  const tanggal = new Date().toISOString().split("T")[0];
  const jam_masuk = new Date().toTimeString().slice(0, 8);

  try {
    await db.query(
      'INSERT INTO absensi (nama, tanggal, jam_masuk, status) VALUES (?, ?, ?, "hadir")',
      [nama, tanggal, jam_masuk]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error menyimpan check-in");
  }
});

// Izin
app.get("/izin", requireMitra, (req, res) => {
  res.render("izin", {
    title: "Form Izin / Sakit",
    username: req.session.user.username,
  });
});

app.post("/izin", requireMitra, async (req, res) => {
  const nama = req.session.user.username;
  const tanggal = new Date().toISOString().split("T")[0];
  const { status, keterangan } = req.body;

  try {
    await db.query(
      'INSERT INTO absensi (nama, tanggal, status, jam_masuk, keterangan) VALUES (?, ?, ?, "00:00:00", ?)',
      [nama, tanggal, status, keterangan]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error menyimpan izin/sakit");
  }
});

// Checkout
app.get("/checkout", requireMitra, async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT * FROM absensi WHERE jam_keluar IS NULL AND status = "hadir" ORDER BY tanggal DESC, id DESC'
    );
    res.render("checkout", {
      title: "Check-out Karyawan",
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.send("Error mengambil data");
  }
});

app.post("/checkout/:id", requireMitra, async (req, res) => {
  const jam_keluar = new Date().toTimeString().slice(0, 8);

  try {
    await db.query(
      "UPDATE absensi SET jam_keluar = ? WHERE id = ?",
      [jam_keluar, req.params.id]
    );
    res.redirect("/checkout");
  } catch (err) {
    console.error(err);
    res.send("Error update check-out");
  }
});

// ----- HRD -----

app.get("/laporan", requireHRD, async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM absensi ORDER BY tanggal DESC, id DESC"
    );
    res.render("laporan", {
      title: "Laporan Absensi",
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.send("Error mengambil data");
  }
});

app.get("/delete/:id", requireHRD, async (req, res) => {
  try {
    await db.query("DELETE FROM absensi WHERE id = ?", [req.params.id]);
    res.redirect("/laporan");
  } catch (err) {
    console.error(err);
    res.send("Error menghapus data");
  }
});

// API Statistik
app.get("/api/stats", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  try {
    const [results] = await db.query(
      `
      SELECT 
        SUM(status = 'hadir') AS hadir,
        SUM(status = 'izin') AS izin,
        SUM(status = 'sakit') AS sakit
      FROM absensi 
      WHERE tanggal = ?
    `,
      [today]
    );

    res.json(results[0] || { hadir: 0, izin: 0, sakit: 0 });
  } catch (err) {
    res.json({ hadir: 0, izin: 0, sakit: 0 });
  }
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
