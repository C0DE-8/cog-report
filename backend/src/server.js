const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
require("dotenv").config();

const authRouter = require("./routes/auth");
const reportingRouter = require("./routes/reporting");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Cog Report API is running" });
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
app.use("/api/reporting", reportingRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
