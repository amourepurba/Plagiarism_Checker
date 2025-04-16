// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
	const token = req.headers["authorization"];
	if (!token) return res.status(401).json({ message: "Token tidak ditemukan" });

	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) return res.status(500).json({ message: "Token tidak valid" });
		req.userId = decoded.id;
		next();
	});
};

module.exports = { verifyToken };
