// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require('../middleware/verifyToken');

// Middleware to allow only admins
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only.' });
  }
  next();
}

// Get all tutor applications
router.get('/admin/tutor-applications', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tutor_applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch applications.' });
  }
});

// Approve or reject application
router.patch('/admin/tutor-applications/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Update status
    await pool.query('UPDATE tutor_applications SET status = $1 WHERE id = $2', [status, id]);

    if (status === 'approved') {
      const result = await pool.query('SELECT * FROM tutor_applications WHERE id = $1', [id]);
      const application = result.rows[0];

      // Insert into users table
      const defaultPassword = 'TempPass123'; // You can use a random password generator
      const bcrypt = require('bcrypt');
      const hashed = await bcrypt.hash(defaultPassword, 10);

      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, bio)
         VALUES ($1, $2, $3, 'tutor', $4)`,
        [application.full_name, application.email, hashed, application.bio]
      );
    }

    res.json({ message: `Application ${status} successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Action failed.' });
  }
});

module.exports = router;

// This code defines admin routes for managing tutor applications in an Express.js application.

// Get all users (admin only)
router.get('/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Get all sessions (admin only)
router.get('/admin/sessions', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.status, s.scheduled_time, s.feedback, s.performance_score,
             st.full_name AS student_name, t.full_name AS tutor_name, sub.name AS subject
      FROM sessions s
      JOIN users st ON s.student_id = st.id
      JOIN users t ON s.tutor_id = t.id
      JOIN subjects sub ON s.subject_id = sub.id
      ORDER BY s.scheduled_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// Admin Analytics
router.get('/admin/analytics', verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      users,
      sessions,
      subjects,
      avgScore
    ] = await Promise.all([

      // Count users by role
      pool.query(`
        SELECT role, COUNT(*) AS count
        FROM users
        GROUP BY role
      `),

      // Count sessions by status
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM sessions
        GROUP BY status
      `),

      // Most booked subjects
      pool.query(`
        SELECT sub.name AS subject, COUNT(s.id) AS total_booked
        FROM sessions s
        JOIN subjects sub ON s.subject_id = sub.id
        GROUP BY sub.name
        ORDER BY total_booked DESC
        LIMIT 5
      `),

      // Average score (completed sessions)
      pool.query(`
        SELECT ROUND(AVG(performance_score)::numeric, 2) AS average_score
        FROM sessions
        WHERE status = 'completed' AND performance_score IS NOT NULL
      `)
    ]);

    res.json({
      users_by_role: users.rows,
      sessions_by_status: sessions.rows,
      top_subjects: subjects.rows,
      average_performance_score: avgScore.rows[0]?.average_score || 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

const { Parser } = require('json2csv');

router.get('/admin/export/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, role, learning_style, bio, created_at
      FROM users
      ORDER BY id
    `);

    const json2csv = new Parser();
    const csv = json2csv.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export users.' });
  }
});

router.get('/admin/export/sessions', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, 
        u1.full_name AS student, 
        u2.full_name AS tutor,
        st.name AS subject,
        s.scheduled_time, 
        s.status, 
        s.feedback, 
        s.performance_score
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.tutor_id = u2.id
      JOIN subjects st ON s.subject_id = st.id
      ORDER BY s.id
    `);

    const json2csv = new Parser();
    const csv = json2csv.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('sessions.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export sessions.' });
  }
});


const sendEmail = require('../utils/sendEmail'); // if not already imported

router.get('/admin/test-email', async (req, res) => {
  try {
    await sendEmail({
      to: 'j.irakoze@alustudent.com', // send to yourself
      subject: '🎉 Test Email from TutorConnect',
      text: 'This is a successful test email from your Node.js backend. Congrats!'
    });

    res.json({ message: '✅ Email sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to send email.' });
  }
});
