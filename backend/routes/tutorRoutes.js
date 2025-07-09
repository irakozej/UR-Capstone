// routes/tutorRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../models/db');
const verifyToken = require('../middleware/verifyToken');
const sendEmail = require('../utils/sendEmail');

// ⚙️ Multer setup
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// ✅ Tutor Registration (Application)
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

// ✅ Update tutor profile safely with or without profile picture
router.post('/tutors/profile', verifyToken, upload.single('profile'), async (req, res) => {
  const { bio, location, price } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    if (imagePath) {
      await pool.query(
        `UPDATE users SET bio = $1, location = $2, price = $3, profile_picture = $4 WHERE id = $5`,
        [bio, location, price, imagePath, req.user.id]
      );
    } else {
      await pool.query(
        `UPDATE users SET bio = $1, location = $2, price = $3 WHERE id = $4`,
        [bio, location, price, req.user.id]
      );
    }

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});


// ✅ Get all approved tutors
router.get('/tutors', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, bio, location, subject, 
             COALESCE(pricing, price, 0) AS price, 
             profile_picture
      FROM users
      WHERE role = 'tutor'
    `);
console.log(result)
    const tutors = result.rows.map(t => ({
      ...t,
      profile_picture: t.profile_picture 
        ? `${req.protocol}://${req.get('host')}${t.profile_picture}` 
        : null
    }));

    res.json(tutors);
  } catch (err) {
    console.error('Fetch tutor error:', err);
    res.status(500).json({ error: 'Failed to fetch tutors' });
  }
});


// ✅ Get current tutor profile
router.get('/tutors/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, bio, location, subject, price, profile_picture
      FROM users
      WHERE id = $1 AND role = 'tutor'
    `, [req.user.id]);

    const tutor = result.rows[0];
    if (tutor) {
      tutor.profile_picture = tutor.profile_picture ? `${req.protocol}://${req.get('host')}${tutor.profile_picture}` : null;
    }

    res.json(tutor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ✅ Get specific tutor by ID (for student view)
router.get('/tutors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT id, full_name, bio, location, subject, pricing AS price, profile_picture

      FROM users
      WHERE id = $1 AND role = 'tutor' AND approved = true
    `, [id]);

    const tutor = result.rows[0];
    if (tutor) {
      tutor.profile_picture = tutor.profile_picture ? `${req.protocol}://${req.get('host')}${tutor.profile_picture}` : null;
      res.json(tutor);
    } else {
      res.status(404).json({ error: 'Tutor not found.' });
    }
  } catch (err) {
    console.error('Failed to fetch tutor by ID:', err);
    res.status(500).json({ error: 'Failed to fetch tutor.' });
  }
});

// ✅ Change tutor password
router.post('/tutors/change-password', verifyToken, async (req, res) => {
  const { current, newPw } = req.body;

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const match = await bcrypt.compare(current, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPw, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);

    res.json({ message: 'Password updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Password update failed.' });
  }
});

// ✅ Add or update availability
router.post('/tutors/availability', verifyToken, async (req, res) => {
  const { slots } = req.body;

  try {
    await pool.query('DELETE FROM tutor_availability WHERE tutor_id = $1', [req.user.id]);

    for (const slot of slots) {
      await pool.query(`
        INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
        VALUES ($1, $2, $3, $4)
      `, [req.user.id, slot.day_of_week, slot.start_time, slot.end_time]);
    }

    res.json({ message: 'Availability updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update availability.' });
  }
});

// ✅ Get availability for current tutor
router.get('/tutors/me/availability', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, day_of_week, start_time, end_time
       FROM tutor_availability
       WHERE tutor_id = $1
       ORDER BY day_of_week`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch availability:', err);
    res.status(500).json({ error: 'Failed to fetch availability.' });
  }
});

// ✅ Get availability by tutor ID (public)
router.get('/tutors/:id/availability', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT day_of_week, start_time, end_time FROM tutor_availability WHERE tutor_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch availability.' });
  }
});

// ✅ Get tutor sessions
router.get('/tutors/me/sessions', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.scheduled_time, s.status, u.full_name AS student_name, st.name AS subject
      FROM sessions s
      JOIN users u ON s.student_id = u.id
      JOIN subjects st ON st.id = s.subject_id
      WHERE s.tutor_id = $1
      ORDER BY s.scheduled_time ASC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch tutor sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// ✅ Cancel session (2 hours before)
router.delete('/tutors/sessions/:id/cancel', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT s.*, u.email AS student_email, u.full_name AS student_name,
             t.email AS tutor_email, t.full_name AS tutor_name
      FROM sessions s
      JOIN users u ON u.id = s.student_id
      JOIN users t ON t.id = s.tutor_id
      WHERE s.id = $1 AND s.tutor_id = $2
    `, [id, req.user.id]);

    const session = result.rows[0];
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const now = new Date();
    const sessionTime = new Date(session.scheduled_time);
    if ((sessionTime - now) < 2 * 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Cannot cancel less than 2 hours before.' });
    }

    await pool.query('UPDATE sessions SET status = $1 WHERE id = $2', ['cancelled', id]);

    // Notify both parties
    await sendEmail({
      to: session.student_email,
      subject: '📅 Session Cancelled',
      text: `Hi ${session.student_name},\n\nYour session at ${session.scheduled_time} has been cancelled by the tutor.`
    });

    await sendEmail({
      to: session.tutor_email,
      subject: '📅 Session Cancelled',
      text: `Hi ${session.tutor_name},\n\nYou have cancelled your session scheduled at ${session.scheduled_time}.`
    });

    res.json({ message: 'Session cancelled and notifications sent.' });
  } catch (err) {
    console.error('Failed to cancel session:', err);
    res.status(500).json({ error: 'Cancellation failed.' });
  }
});

module.exports = router;
