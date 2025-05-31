const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require('../middleware/verifyToken');


// GET all approved tutors with filters
router.get('/tutors', async (req, res) => {
  const { subject, location, min_experience } = req.query;

  try {
    let query = `
      SELECT u.id, u.full_name, u.email, u.bio, u.profile_picture, u.created_at,
  ts.experience_years, ts.rating, s.name AS subject, u.role
FROM users u
JOIN tutor_subjects ts ON ts.tutor_id = u.id
JOIN subjects s ON ts.subject_id = s.id
WHERE u.role = 'tutor'
    `;

    const tutors = result.rows.map(tutor => ({
        ...tutor,
        profile_picture: tutor.profile_picture 
          ? `${req.protocol}://${req.get('host')}${tutor.profile_picture}`
          : null
      }));
      res.json(tutors);

    const params = [];

    if (subject) {
      params.push(subject);
      query += ` AND s.name ILIKE $${params.length}`;
    }

    if (location) {
      params.push(`%${location}%`);
      query += ` AND u.bio ILIKE $${params.length}`; // You can add location as its own column later
    }

    if (min_experience) {
      params.push(min_experience);
      query += ` AND ts.experience_years >= $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tutors' });
  }
});

module.exports = router;

// GET top tutors
router.get('/tutors/top', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          u.id AS tutor_id,
          u.full_name,
          u.email,
          u.profile_picture,
          ts.experience_years,
          sub.name AS subject,
          COUNT(s.id) AS total_sessions,
          ROUND(AVG(s.performance_score)::numeric, 2) AS average_rating
        FROM users u
        JOIN tutor_subjects ts ON ts.tutor_id = u.id
        JOIN subjects sub ON sub.id = ts.subject_id
        LEFT JOIN sessions s ON s.tutor_id = u.id AND s.status = 'completed'
        WHERE u.role = 'tutor'
        GROUP BY u.id, ts.experience_years, sub.name
        ORDER BY average_rating DESC NULLS LAST, total_sessions DESC
        LIMIT 10;
      `);
  
      const tutors = result.rows.map(tutor => ({
        ...tutor,
        profile_picture: tutor.profile_picture
          ? `${req.protocol}://${req.get('host')}${tutor.profile_picture}`
          : null
      }));
  
      res.json(tutors);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch top tutors.' });
    }
  });

// Smart match: Recommend top tutors by subject
// Recommend top tutors based on subject, learning style, and location

// Recommend top tutors based on subject, learning style, and location
router.get('/tutors/recommend', verifyToken, async (req, res) => {
    const { subject } = req.query;
  
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can get recommendations.' });
    }
  
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required.' });
    }
  
    try {
      // Get student preferences
      const studentData = await pool.query(
        'SELECT learning_style, bio FROM users WHERE id = $1',
        [req.user.id]
      );
  
      const { learning_style, bio } = studentData.rows[0];
      const studentLocation = bio?.match(/from\s+([A-Za-z\s]+)/i)?.[1]?.trim().toLowerCase() || '';
  
      // Query tutors for the subject
      const result = await pool.query(`
        SELECT 
          u.id AS tutor_id,
          u.full_name,
          u.email,
          u.profile_picture,
          ts.experience_years,
          sub.name AS subject,
          u.bio AS tutor_bio,
          COUNT(s.id) AS total_sessions,
          ROUND(AVG(s.performance_score)::numeric, 2) AS average_rating
        FROM users u
        JOIN tutor_subjects ts ON ts.tutor_id = u.id
        JOIN subjects sub ON sub.id = ts.subject_id
        LEFT JOIN sessions s ON s.tutor_id = u.id AND s.status = 'completed'
        WHERE u.role = 'tutor'
          AND sub.name ILIKE $1
        GROUP BY u.id, ts.experience_years, sub.name
      `, [subject]);
  
      // Prioritize tutors with similar location
      const tutors = result.rows.map(tutor => {
        const tutorLocation = tutor.tutor_bio?.match(/from\s+([A-Za-z\s]+)/i)?.[1]?.trim().toLowerCase() || '';
        const locationMatch = tutorLocation === studentLocation ? 1 : 0;
  
        return {
          ...tutor,
          profile_picture: tutor.profile_picture
            ? `${req.protocol}://${req.get('host')}${tutor.profile_picture}`
            : null,
          location_match: locationMatch
        };
      });
  
      // Sort by location match first, then rating, then session count
      const sorted = tutors.sort((a, b) => {
        if (b.location_match !== a.location_match) return b.location_match - a.location_match;
        if (b.average_rating !== a.average_rating) return b.average_rating - a.average_rating;
        return b.total_sessions - a.total_sessions;
      });
  
      res.json(sorted.slice(0, 3));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch personalized recommendations.' });
    }
  });
  
  router.get('/tutors/search', verifyToken, async (req, res) => {
    const { location } = req.query;
  
    try {
      let query = `
        SELECT id, full_name, email, location, bio, profile_picture
        FROM users
        WHERE role = 'tutor'
      `;
      const values = [];
  
      if (location) {
        query += ` AND LOWER(location) LIKE $1`;
        values.push(`%${location.toLowerCase()}%`);
      }
  
      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to search tutors' });
    }
  });
  
  router.post('/reviews', verifyToken, async (req, res) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can leave reviews.' });
    }
  
    const { session_id, tutor_id, rating, comment } = req.body;
  
    try {
      // Prevent duplicate reviews
      const existing = await pool.query(
        'SELECT * FROM reviews WHERE session_id = $1 AND student_id = $2',
        [session_id, req.user.id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'You already reviewed this session.' });
      }
  
      // Insert review
      const result = await pool.query(`
        INSERT INTO reviews (session_id, student_id, tutor_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [session_id, req.user.id, tutor_id, rating, comment]);
  
      res.status(201).json({ message: 'Review submitted.', review: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to submit review.' });
    }
  });
  