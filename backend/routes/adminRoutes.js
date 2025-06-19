// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require('../middleware/verifyToken');
const { Parser } = require('json2csv');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcrypt');

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only.' });
  }
  next();
}

router.get('/admin/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users, tutors, students, sessions, ratings, topTutors, pending] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'tutor'`),
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'student'`),
      pool.query(`SELECT COUNT(*) FROM sessions`),
      pool.query(`SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews`),
      pool.query(`
        SELECT u.full_name, COUNT(s.id) AS completed_sessions
        FROM sessions s
        JOIN users u ON u.id = s.tutor_id
        WHERE s.status = 'completed'
        GROUP BY u.id
        ORDER BY completed_sessions DESC
        LIMIT 3
      `),
      pool.query(`SELECT COUNT(*) FROM tutor_applications WHERE status = 'pending'`)
    ]);

    res.json({
      total_users: parseInt(users.rows[0].count),
      total_tutors: parseInt(tutors.rows[0].count),
      total_students: parseInt(students.rows[0].count),
      total_sessions: parseInt(sessions.rows[0].count),
      average_rating: ratings.rows[0].round || 0,
      top_tutors: topTutors.rows,
      total_pending: parseInt(pending.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/admin/pending-tutors', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, subject, price, bio, created_at
      FROM tutor_applications
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending tutors.' });
  }
});

router.patch('/admin/approve-tutor/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`UPDATE tutor_applications SET status = 'approved' WHERE id = $1`, [id]);

    const result = await pool.query(`SELECT * FROM tutor_applications WHERE id = $1`, [id]);
    const tutor = result.rows[0];

    const hashed = await bcrypt.hash(tutor.password_hash || 'Temp123!', 10);
    await pool.query(`
      INSERT INTO users (full_name, email, password_hash, role, bio, location, subject, price, profile_picture, approved)
      VALUES ($1, $2, $3, 'tutor', $4, $5, $6, $7, $8, true)
    `, [tutor.full_name, tutor.email, hashed, tutor.bio, tutor.location, tutor.subject, tutor.price, tutor.profile_picture]);

    await sendEmail({
      to: tutor.email,
      subject: '🎉 Your Tutor Application was Approved!',
      text: `Hello ${tutor.full_name},\n\nYour tutor application has been approved. You may now log into your account.\n\nTutorConnect Team`
    });

    res.json({ message: 'Tutor approved and registered.' });
  } catch (err) {
    console.error('Failed to approve tutor:', err);
    res.status(500).json({ error: 'Approval failed.' });
  }
});

router.delete('/admin/reject-tutor/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT email, full_name FROM tutor_applications WHERE id = $1', [id]);
    const tutor = result.rows[0];

    await sendEmail({
      to: tutor.email,
      subject: '❌ Tutor Application Rejected',
      text: `Dear ${tutor.full_name},\n\nWe regret to inform you that your tutor application has been rejected.`
    });

    await pool.query('UPDATE tutor_applications SET status = $1 WHERE id = $2', ['rejected', id]);
    res.json({ message: 'Tutor rejected and notified.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject tutor' });
  }
});

router.get('/admin/tutors', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, bio, subject, price, created_at
      FROM users
      WHERE role = 'tutor' AND approved = true
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tutors.' });
  }
});

router.get('/admin/students', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, learning_style, created_at
      FROM users
      WHERE role = 'student'
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

router.get('/admin/sessions', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.status,
        s.scheduled_time,
        u1.full_name AS student,
        u2.full_name AS tutor,
        sub.name AS subject
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.tutor_id = u2.id
      JOIN subjects sub ON s.subject_id = sub.id
      ORDER BY s.scheduled_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

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
        s.subject_id,
        s.scheduled_time, 
        s.status, 
        s.feedback, 
        s.performance_score
      FROM sessions s
      JOIN users u1 ON s.student_id = u1.id
      JOIN users u2 ON s.tutor_id = u2.id
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

router.get('/admin/test-email', async (req, res) => {
  try {
    await sendEmail({
      to: 'j.irakoze@alustudent.com',
      subject: '🎉 Test Email from TutorConnect',
      text: 'This is a successful test email from your Node.js backend. Congrats!'
    });
    res.json({ message: '✅ Email sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to send email.' });
  }
});

module.exports = router;
