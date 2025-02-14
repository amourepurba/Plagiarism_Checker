const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth } = require("../config/firebase");


// Register dengan Email/Password
exports.register = async (req, res) =>  {
  try {
    const { username, email, password } = req.body;
    
    // Validasi input
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
    }

    // Cek email sudah terdaftar
    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: "Email sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan ke database
    await db.query(
      "INSERT INTO users (username, email, password, provider) VALUES (?, ?, ?, 'local')",
      [username, email, hashedPassword]
    );

    res.status(201).json({ success: true, message: "Registrasi berhasil" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Login dengan Email/Password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cek user
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Email tidak terdaftar" });
    }

    const user = users[0];
    
    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Password salah" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Login/Register dengan Google
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    // Verifikasi token Firebase
    const decodedToken = await auth.verifyIdToken(token);
    const { email, name, uid: googleId } = decodedToken;

    // Cek user di database
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ? OR google_id = ?",
      [email, googleId]
    );

    if (existingUser.length > 0) {
      // User sudah ada
      const user = existingUser[0];
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      
      return res.json({
        success: true,
        message: "Login Google berhasil",
        token: jwtToken,
        user: { id: user.id, username: user.username, email: user.email }
      });
    }

    // User baru
    const [result] = await db.query(
      "INSERT INTO users (username, email, provider, google_id) VALUES (?, ?, 'google', ?)",
      [name, email, googleId]
    );

    const newUser = {
      id: result.insertId,
      username: name,
      email,
      provider: "google"
    };

    const jwtToken = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      success: true,
      message: "Registrasi Google berhasil",
      token: jwtToken,
      user: newUser
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ success: false, message: "Gagal autentikasi Google" });
  }

  
};