require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// routes
const plagiarismCheckRouter = require("./routes/plagiarismCheck");
const authRouter = require("./routes/authentication");

app.use("/api/check", plagiarismCheckRouter);
app.use("/api/auth", authRouter);

require("./config/db");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
});