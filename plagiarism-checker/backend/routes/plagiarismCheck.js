const express = require("express");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { checkText, checkFile, checkUrl } = require("../controllers/plagiarismCheck");

const router = express.Router();

router.post("/check-text", checkText);
router.post("/check-file", upload.single('file'), checkFile);
router.post("/check-url", checkUrl);

module.exports = router;