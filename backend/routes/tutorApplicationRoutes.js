const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../models/db');

// ✅ Setup multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// ✅ Tutor Application Route
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePicturePath = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ Match this to your actual table columns
    await pool.query(`
      INSERT INTO tutor_applications
        (full_name, email, password, bio, location, subject, price, profile_picture, status, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
    `, [
      full_name,
      email,
      hashedPassword,
      bio,
      location,
      subject,
      price,
      profilePicturePath
    ]);

    res.json({ message: '✅ Application submitted successfully. Awaiting admin approval.' });

  } catch (err) {
    console.error('Tutor apply error:', err);
    res.status(500).json({ error: '❌ Failed to apply as tutor.' });
  }
});

module.exports = router;
