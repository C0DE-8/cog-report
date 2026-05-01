const express = require("express");
require("dotenv").config();

const authRouter = require("./routes/auth");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Auth API is running" });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ message: "Database connected" });
  } catch (error) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
