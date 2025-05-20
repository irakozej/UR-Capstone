// routes/protectedRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

router.get('/dashboard', verifyToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.role}! Your user ID is ${req.user.id}`
  });
});

module.exports = router;
