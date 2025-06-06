const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../models/db');
const verifyToken = require('../middleware/verifyToken');

// Configure multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Upload profile picture
router.post('/tutors/upload-picture', verifyToken, upload.single('profile'), async (req, res) => {
  if (req.user.role !== 'tutor') {
    return res.status(403).json({ error: 'Only tutors can upload pictures.' });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  try {
    await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2',
      [imagePath, req.user.id]
    );

    res.json({ message: 'Profile picture uploaded successfully.', path: imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed.' });
  }
});

// ✅ Get all tutors
router.get('/tutors', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, bio, location, price, profile_picture
      FROM users
      WHERE role = 'tutor'
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch tutor error:', err);
    res.status(500).json({ error: 'Failed to fetch tutors' });
  }
});

// ✅ Add tutor availability
router.post('/tutors/availability', verifyToken, async (req, res) => {
  if (req.user.role !== 'tutor') {
    return res.status(403).json({ error: 'Only tutors can update availability.' });
  }

  const { slots } = req.body;

  try {
    await pool.query('DELETE FROM tutor_availability WHERE tutor_id = $1', [req.user.id]);

    for (const slot of slots) {
      await pool.query(
        `INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [req.user.id, slot.day_of_week, slot.start_time, slot.end_time]
      );
    }

    res.json({ message: 'Availability updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update availability.' });
  }
});

// ✅ Get availability by tutor ID
router.get('/tutors/:id/availability', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT day_of_week, start_time, end_time
       FROM tutor_availability
       WHERE tutor_id = $1
       ORDER BY day_of_week`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch availability.' });
  }
});

// ✅ Get reviews for a tutor
router.get('/tutors/:id/reviews', async (req, res) => {
  const tutorId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT r.*, u.full_name AS student_name
      FROM reviews r
      JOIN users u ON u.id = r.student_id
      WHERE r.tutor_id = $1
      ORDER BY r.created_at DESC
    `, [tutorId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get single tutor by ID
router.get('/tutors/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.bio, u.profile_picture, u.location, u.pricing,
             ts.experience_years, ts.rating, s.name AS subject
      FROM users u
      JOIN tutor_subjects ts ON ts.tutor_id = u.id
      JOIN subjects s ON s.id = ts.subject_id
      WHERE u.id = $1 AND u.role = 'tutor'
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tutor not found.' });
    }

    const tutor = result.rows[0];
    tutor.profile_picture = tutor.profile_picture
      ? `${req.protocol}://${req.get('host')}${tutor.profile_picture}`
      : null;

    res.json(tutor);
  } catch (err) {
    console.error('Failed to fetch tutor by ID:', err);
    res.status(500).json({ error: 'Failed to fetch tutor profile.' });
  }
});


module.exports = router; // ✅ Export at the very end
