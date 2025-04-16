require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Konfigurasi koneksi MySQL
const db = require('./config/db');

// Endpoint untuk Registrasi User
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Semua field harus diisi.' });
  }

  // Cek apakah user sudah ada
  const checkSql = "SELECT id FROM users WHERE email = ?";
  db.query(checkSql, [email], async (checkErr, checkResults) => {
    if (checkErr) {
      console.error(checkErr);
      return res.status(500).json({ message: 'Terjadi kesalahan pada database', error: checkErr });
    }
    if (checkResults.length > 0) {
      // Jika user sudah ada, kembalikan status conflict (409)
      return res.status(409).json({ message: 'Email already exist' });
    }

    try {
      // Hash password sebelum disimpan
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
      db.query(sql, [username, email, hashedPassword], (err, result) => {
        if (err) {
          // Jika terjadi duplicate entry meskipun sudah dicek
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already exist' });
          }
          console.error(err);
          return res.status(500).json({ message: 'Terjadi kesalahan pada database', error: err });
        }
        res.status(201).json({ message: 'User berhasil didaftarkan' });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// Endpoint untuk Login dengan email & password
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password harus diisi.' });
  }
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Terjadi kesalahan pada database', error: err });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }
    const user = results[0];
    // Cek kesesuaian password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }
    // Buat token JWT (kadaluarsa 1 jam)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  });
});

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ message: 'Token tidak valid' });
    req.userId = decoded.id;
    next();
  });
};

// Contoh endpoint terproteksi (profil user)
app.get('/profile', verifyToken, (req, res) => {
  const sql = "SELECT id, username, email FROM users WHERE id = ?";
  db.query(sql, [req.userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Terjadi kesalahan pada database', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    res.json({ user: results[0] });
  });
});

const PORT = process.env.PORT || 3006; 
app.listen(PORT, () => console.log(`Server berjalan pada port ${PORT}`));
