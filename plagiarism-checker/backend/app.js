require('dotenv').config();

const express = require('express');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;

if (!process.env.API_URL || !process.env.SECRET_CODE) {
  console.error("API_URL atau SECRET_CODE tidak ditemukan dalam environment variables.");
  process.exit(1);
}

const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const plagiarismCheckRouter = require('./routes/plagiarismCheck');
app.post('/', plagiarismCheckRouter);

app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`));