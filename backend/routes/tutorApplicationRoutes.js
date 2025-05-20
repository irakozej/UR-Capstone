// routes/tutorApplicationRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// Public tutor application form
router.post('/tutors/apply', async (req, res) => {
  const { full_name, email, subject, location, experience_years, bio } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM tutor_applications WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Application with this email already exists.' });
    }

    const result = await pool.query(
      `INSERT INTO tutor_applications (full_name, email, subject, location, experience_years, bio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [full_name, email, subject, location, experience_years, bio]
    );

    res.status(201).json({ message: 'Application submitted successfully.', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

module.exports = router;
