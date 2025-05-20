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
