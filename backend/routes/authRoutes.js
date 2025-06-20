// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ✅ Student Signup Route
router.post('/signup', async (req, res) => {
  const { full_name, email, password, learning_style } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  try {
    // Check if user already exists
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(`
      INSERT INTO users (full_name, email, password_hash, role, learning_style, created_at)
      VALUES ($1, $2, $3, 'student', $4, NOW())
    `, [full_name, email, hashed, learning_style]);

    res.json({ message: '✅ Student signup successful. You can now log in.' });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: '❌ Failed to register student.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const result = await pool.query(
        `SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1`,
        [email]
      );
  
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials (email)' });
      }
  
      const user = result.rows[0];
  
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials (password)' });
      }
  
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1d'
      });
  
      res.json({
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
module.exports = router;
