const express = require("express");
const router = express.Router();
const { googleAuth,login, register, profile } = require("../controllers/authController");
const authMiddleware = require('../middleware/auth');



router.post("/register", register);
router.post("/login", login);
router.post("/profile", authMiddleware.verifyToken, profile);
router.post("/google-auth", googleAuth);

module.exports = router;