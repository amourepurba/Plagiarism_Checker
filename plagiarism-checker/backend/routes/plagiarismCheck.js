const express = require("express");
const router = express.Router();
const multer = require("multer");
const { checkText, checkFile, checkUrl } = require("../controllers/plagiarismCheck");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/check-text", checkText);
router.post("/check-file", upload.single("file"), checkFile);
router.post("/check-url", checkUrl);

module.exports = router; 