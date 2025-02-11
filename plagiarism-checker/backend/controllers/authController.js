import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Register User
export const register = async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
  db.query(query, [username, email, hashedPassword], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Email sudah digunakan!" });
    }
    res.status(201).json({ message: "Registrasi berhasil!" });
  });
};

// Login User
export const login = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ message: "Email tidak ditemukan!" });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Password salah!" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login berhasil!", token, user });
  });
};

// Login dengan Google
export const googleAuth = (req, res) => {
  const { email, google_id, username } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (results.length === 0) {
      // User baru, daftar ke database
      db.query(
        "INSERT INTO users (username, email, provider, google_id) VALUES (?, ?, 'google', ?)",
        [username, email, google_id],
        (err, result) => {
          if (err) return res.status(500).json({ message: "Error saat menyimpan user" });
          res.status(201).json({ message: "Google Login berhasil!", user: { email, username } });
        }
      );
    } else {
      res.json({ message: "Login berhasil!", user: results[0] });
    }
  });
};
