const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
// This code sets up two routes for user registration and login.
// It uses the Express router to define the endpoints and links them to the corresponding controller methods.