const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = global.GlobalDatabase;

exports.register = async (req, res) => {
	const { username, email, password } = req.body;
	if (!username || !email || !password) {
		return res.status(400).json({ message: "Semua field harus diisi." });
	}

	const checkSql = "SELECT id FROM users WHERE email = ?";
	db.query(checkSql, [email], async (checkErr, checkResults) => {
		if (checkErr) {
			console.error(checkErr);
			return res.status(500).json({ message: "Terjadi kesalahan pada database", error: checkErr });
		}
		if (checkResults.length > 0) {
			return res.status(409).json({ message: "Email already exist" });
		}

		try {
			const hashedPassword = await bcrypt.hash(password, 10);
			const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
			db.query(sql, [username, email, hashedPassword], (err, result) => {
				if (err) {
					if (err.code === "ER_DUP_ENTRY") {
						return res.status(409).json({ message: "Email already exist" });
					}
					console.error(err);
					return res.status(500).json({ message: "Terjadi kesalahan pada database", error: err });
				}
				res.status(201).json({ message: "User berhasil didaftarkan" });
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Server error" });
		}
	});
};

// Login 
exports.login = async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json({ message: "Email dan password harus diisi." });
	}
	const sql = "SELECT * FROM users WHERE email = ?";
	db.query(sql, [email], async (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ message: "Terjadi kesalahan pada database", error: err });
		}
		if (results.length === 0) {
			return res.status(401).json({ message: "User tidak ditemukan" });
		}
		const user = results[0];
		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword) {
			return res.status(401).json({ message: "Kredensial tidak valid" });
		}
		const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
		res.json({
			token, 
			user: { 
			  id: user.id, 
			  username: user.username, 
			  email: user.email 
			}
		  });
	});
};

exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    const decodedToken = await auth.verifyIdToken(token);
    const { email, name, uid: googleId } = decodedToken;

    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ? OR google_id = ?",
      [email, googleId]
    );

    if (existingUser.length > 0) {
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

exports.profile = async (req, res) => {
	const sql = "SELECT id, username, email FROM users WHERE id = ?";
	db.query(sql, [req.userId], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ message: "Terjadi kesalahan pada database", error: err });
		}
		if (results.length === 0) {
			return res.status(404).json({ message: "User tidak ditemukan" });
		}
		res.json({ user: results[0] });
	});
};
