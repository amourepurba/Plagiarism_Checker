const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail } = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  findUserByEmail(email, (err, results) => {
    if (results.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    createUser(name, email, hashedPassword, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "User registered successfully" });
    });
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  findUserByEmail(email, async (err, results) => {
    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
});

module.exports = router;
