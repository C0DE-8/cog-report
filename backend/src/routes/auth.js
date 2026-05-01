const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const router = express.Router();

// api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), normalizedEmail, hashedPassword]
    );

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

// api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
