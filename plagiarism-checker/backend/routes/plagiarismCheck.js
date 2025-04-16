const express = require("express");
const { checkText } = require("../controllers/plagiarismCheck");

const router = express.Router();

router.post("/check-text", checkText);
router.post("/check-file", login);
router.post("/check-url", googleAuth);

module.exports = router;