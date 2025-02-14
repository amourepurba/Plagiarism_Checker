import express from "express";
import db from "../config/db.js";

const router = express.Router();

// API untuk menyimpan pesan kontak
router.post("/", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Semua kolom harus diisi!" });
  }

  const sql = "INSERT INTO contact (name, email, message) VALUES (?, ?, ?)";
  const values = [name, email, message];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).json({ error: "Gagal menyimpan pesan!" });
    }
    res.status(201).json({ message: "Pesan berhasil dikirim!", id: result.insertId });
  });
});

export default router;
