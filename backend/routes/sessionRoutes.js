const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require('../middleware/verifyToken');

// Student books a session
router.post('/sessions/book', verifyToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can book sessions.' });
  }

  const { tutor_id, subject_id, scheduled_time } = req.body;

  try {
    // Step 1: Check if tutor is available at that time
    const sessionTime = new Date(scheduled_time);
    const dayOfWeek = sessionTime.toLocaleString('en-US', { weekday: 'long' });
    const sessionHour = sessionTime.toTimeString().split(' ')[0]; // "14:30:00"

    const availabilityResult = await pool.query(
      `SELECT * FROM tutor_availability
       WHERE tutor_id = $1 AND day_of_week = $2
       AND start_time <= $3::time AND end_time > $3::time`,
      [tutor_id, dayOfWeek, sessionHour]
    );

    if (availabilityResult.rows.length === 0) {
      return res.status(400).json({ error: 'Tutor is not available at this time.' });
    }

    // Step 2: Check for conflicting session
    const conflict = await pool.query(
      `SELECT * FROM sessions
       WHERE tutor_id = $1
       AND status IN ('scheduled', 'completed')
       AND scheduled_time BETWEEN $2 AND ($2::timestamp + interval '59 minutes')`,
      [tutor_id, scheduled_time]
    );

    if (conflict.rows.length > 0) {
      return res.status(400).json({ error: 'Tutor already has a session at this time.' });
    }

    // Step 3: Book the session
    const result = await pool.query(
      `INSERT INTO sessions (student_id, tutor_id, subject_id, scheduled_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, tutor_id, subject_id, scheduled_time]
    );

    res.status(201).json({ message: 'Session booked successfully', session: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Student or Tutor views their sessions
router.get('/sessions/my', verifyToken, async (req, res) => {
  try {
    const column = req.user.role === 'tutor' ? 'tutor_id' : 'student_id';

    const result = await pool.query(
      `SELECT s.*, u.full_name AS tutor_name, st.name AS subject
       FROM sessions s
       JOIN users u ON u.id = s.tutor_id
       JOIN subjects st ON st.id = s.subject_id
       WHERE s.${column} = $1
       ORDER BY scheduled_time DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Tutor marks session as completed (with optional feedback)
router.patch('/sessions/:id/complete', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { feedback, performance_score } = req.body;

  if (req.user.role !== 'tutor') {
    return res.status(403).json({ error: 'Only tutors can complete sessions.' });
  }

  try {
    const session = await pool.query(
      `SELECT * FROM sessions WHERE id = $1 AND tutor_id = $2`,
      [id, req.user.id]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or not yours.' });
    }

    await pool.query(
      `UPDATE sessions
       SET status = 'completed',
           feedback = $1,
           performance_score = $2
       WHERE id = $3`,
      [feedback || null, performance_score || null, id]
    );

    res.json({ message: 'Session marked as completed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

module.exports = router;
// Student or Tutor cancels a session
router.patch('/sessions/:id/cancel', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if session exists and belongs to this user
    const session = await pool.query(
      `SELECT * FROM sessions WHERE id = $1`,
      [id]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const s = session.rows[0];

    if (req.user.id !== s.student_id && req.user.id !== s.tutor_id) {
      return res.status(403).json({ error: 'You can only cancel your own session.' });
    }

    if (s.status === 'cancelled') {
      return res.status(400).json({ error: 'Session is already cancelled.' });
    }

    // Update status to cancelled
    await pool.query(
      `UPDATE sessions SET status = 'cancelled' WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Session cancelled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel session.' });
  }
});
