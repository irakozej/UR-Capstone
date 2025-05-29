const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require('../middleware/verifyToken');
const sendEmail = require('../utils/sendEmail');

// Student books a session
router.post('/sessions/book', verifyToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can book sessions.' });
  }

  const { tutor_id, subject_id, scheduled_time } = req.body;

  try {
    const sessionTime = new Date(scheduled_time);
    const dayOfWeek = sessionTime.toLocaleString('en-US', { weekday: 'long' });
    const sessionHour = sessionTime.toTimeString().split(' ')[0];

    const availabilityResult = await pool.query(
      `SELECT * FROM tutor_availability
       WHERE tutor_id = $1 AND day_of_week = $2
       AND start_time <= $3::time AND end_time > $3::time`,
      [tutor_id, dayOfWeek, sessionHour]
    );

    if (availabilityResult.rows.length === 0) {
      return res.status(400).json({ error: 'Tutor is not available at this time.' });
    }

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

    const result = await pool.query(
      `INSERT INTO sessions (student_id, tutor_id, subject_id, scheduled_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, tutor_id, subject_id, scheduled_time]
    );

    const session = result.rows[0];

    const [studentRes, tutorRes] = await Promise.all([
      pool.query('SELECT email, full_name FROM users WHERE id = $1', [req.user.id]),
      pool.query('SELECT email, full_name FROM users WHERE id = $1', [tutor_id])
    ]);

    await sendEmail({
      to: tutorRes.rows[0].email,
      subject: '📚 New Session Booked',
      text: `Hello ${tutorRes.rows[0].full_name},\n\nYou have a new session booked with ${studentRes.rows[0].full_name} on ${scheduled_time}.`
    });

    await sendEmail({
      to: studentRes.rows[0].email,
      subject: '✅ Session Booking Confirmed',
      text: `Hi ${studentRes.rows[0].full_name},\n\nYour session with ${tutorRes.rows[0].full_name} has been confirmed for ${scheduled_time}.`
    });

    res.status(201).json({ message: 'Session booked successfully', session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Student or Tutor views their sessions
router.get('/sessions/my', verifyToken, async (req, res) => {
  try {
    const column = req.user.role === 'tutor' ? 'tutor_id' : 'student_id';
    const filter = req.query.status; // e.g., ?status=completed

    let query = `
      SELECT s.*, 
             u.full_name AS tutor_name, 
             st.name AS subject
      FROM sessions s
      JOIN users u ON u.id = s.tutor_id
      JOIN subjects st ON st.id = s.subject_id
      WHERE s.${column} = $1
    `;

    const values = [req.user.id];

    if (filter === 'completed') {
      query += ' AND s.status = $2';
      values.push('completed');
    } else if (filter === 'upcoming') {
      query += ' AND s.status = $2 AND s.scheduled_time > NOW()';
      values.push('scheduled');
    }

    query += ' ORDER BY s.scheduled_time DESC';

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
});


// Tutor marks session as completed
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
    res.status(500).json({ error: 'Failed to complete session.' });
  }
});

// Student or Tutor cancels a session
router.patch('/sessions/:id/cancel', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const sessionRes = await pool.query(`SELECT * FROM sessions WHERE id = $1`, [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const s = sessionRes.rows[0];

    if (req.user.id !== s.student_id && req.user.id !== s.tutor_id) {
      return res.status(403).json({ error: 'You can only cancel your own session.' });
    }

    if (s.status === 'cancelled') {
      return res.status(400).json({ error: 'Session is already cancelled.' });
    }

    await pool.query(`UPDATE sessions SET status = 'cancelled' WHERE id = $1`, [id]);

    const [student, tutor] = await Promise.all([
      pool.query('SELECT email, full_name FROM users WHERE id = $1', [s.student_id]),
      pool.query('SELECT email, full_name FROM users WHERE id = $1', [s.tutor_id])
    ]);

    await sendEmail({
      to: student.rows[0].email,
      subject: '❌ Session Cancelled',
      text: `Hi ${student.rows[0].full_name},\n\nYour session (ID: ${id}) has been cancelled.`
    });

    await sendEmail({
      to: tutor.rows[0].email,
      subject: '❌ Session Cancelled',
      text: `Hi ${tutor.rows[0].full_name},\n\nYour session (ID: ${id}) has been cancelled.`
    });

    res.json({ message: 'Session cancelled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel session.' });
  }
});

// Reschedule session
router.patch('/sessions/:id/reschedule', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { new_time } = req.body;

  try {
    const sessionRes = await pool.query(`SELECT * FROM sessions WHERE id = $1`, [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const session = sessionRes.rows[0];
    const userIsOwner = req.user.id === session.student_id || req.user.id === session.tutor_id;
    if (!userIsOwner) {
      return res.status(403).json({ error: 'You can only reschedule your own session.' });
    }

    const newDate = new Date(new_time);
    const dayOfWeek = newDate.toLocaleString('en-US', { weekday: 'long' });
    const hour = newDate.toTimeString().split(' ')[0];

    const availability = await pool.query(`
      SELECT * FROM tutor_availability
      WHERE tutor_id = $1 AND day_of_week = $2
      AND start_time <= $3::time AND end_time > $3::time
    `, [session.tutor_id, dayOfWeek, hour]);

    if (availability.rows.length === 0) {
      return res.status(400).json({ error: 'Tutor is not available at the new time.' });
    }

    const conflict = await pool.query(`
      SELECT * FROM sessions
      WHERE tutor_id = $1 AND id != $2
      AND status IN ('scheduled', 'completed')
      AND scheduled_time BETWEEN $3 AND ($3::timestamp + interval '59 minutes')
    `, [session.tutor_id, id, new_time]);

    if (conflict.rows.length > 0) {
      return res.status(400).json({ error: 'Tutor has another session at that time.' });
    }

    await pool.query(`
      UPDATE sessions
      SET scheduled_time = $1
      WHERE id = $2
    `, [new_time, id]);

    const [student, tutor] = await Promise.all([
      pool.query('SELECT email, full_name FROM users WHERE id = $1', [session.student_id]),
      pool.query('SELECT email, full_name FROM users WHERE id = $1', [session.tutor_id])
    ]);

    await sendEmail({
      to: student.rows[0].email,
      subject: '🔁 Session Rescheduled',
      text: `Hi ${student.rows[0].full_name},\n\nYour session (ID: ${id}) has been rescheduled to ${new_time}.`
    });

    await sendEmail({
      to: tutor.rows[0].email,
      subject: '🔁 Session Rescheduled',
      text: `Hi ${tutor.rows[0].full_name},\n\nYour session (ID: ${id}) has been rescheduled to ${new_time}.`
    });

    res.json({ message: 'Session rescheduled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reschedule session.' });
  }
});

module.exports = router;

router.get('/sessions/performance/overview', verifyToken, async (req, res) => {
  if (req.user.role !== 'tutor') {
    return res.status(403).json({ error: 'Only tutors can view this data.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_sessions,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_sessions,
        ROUND(AVG(performance_score)::numeric, 2) AS average_score
      FROM sessions
      WHERE tutor_id = $1
    `, [req.user.id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load performance overview.' });
  }
});


// Tutor performance overview
router.get('/sessions/performance/overview', verifyToken, async (req, res) => {
  if (req.user.role !== 'tutor') {
    return res.status(403).json({ error: 'Only tutors can view this data.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_sessions,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_sessions,
        ROUND(AVG(performance_score)::numeric, 2) AS average_score
      FROM sessions
      WHERE tutor_id = $1
    `, [req.user.id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load performance overview.' });
  }
});
