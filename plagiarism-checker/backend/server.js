require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Konfigurasi koneksi MySQL
require('./config/db');

if (!process.env.API_URL || !process.env.SECRET_CODE) {
  console.error("API_URL atau SECRET_CODE tidak ditemukan dalam environment variables.");
  process.exit(1);
}

const plagiarismCheckRouter = require('./routes/plagiarismCheck');
const authRouter = require('./routes/authentication');

app.post('/', plagiarismCheckRouter);
app.post('/', authRouter);

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => console.log(`Server berjalan pada port ${PORT}`));
