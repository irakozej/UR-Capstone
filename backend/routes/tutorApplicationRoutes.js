const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../models/db');

// ✅ Setup multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// ✅ Tutor Application (signup)
router.post('/tutors/apply', upload.single('profile_picture'), async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      bio,
      location,
      subject,
      price
    } = req.body;

    if (!full_name || !email || !password || !bio || !location || !subject || !price) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check for duplicates
    const existing = await pool.query('SELECT 1 FROM tutor_applications WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already used for application.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const profilePicturePath = req.file ? `/uploads/${req.file.filename}` : null;

    await pool.query(`
      INSERT INTO tutor_applications
        (full_name, email, password_hash, bio, location, subject, price, profile_picture, status, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
    `, [full_name, email, hashed, bio, location, subject, price, profilePicturePath]);

    res.json({ message: '✅ Application submitted successfully. Awaiting admin approval.' });

  } catch (err) {
    console.error('Tutor apply error:', err);
    res.status(500).json({ error: '❌ Failed to apply as tutor.' });
  }
});

module.exports = router;
