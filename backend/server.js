// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// This code sets up an Express server with CORS and JSON parsing middleware.
// It also imports and uses authentication routes from a separate file.
// The server listens on a specified port, defaulting to 5000 if not provided in the environment variables.

const protectedRoutes = require('./routes/protectedRoutes');
app.use('/api', protectedRoutes);
// This code imports and uses protected routes from a separate file.

const tutorApplicationRoutes = require('./routes/tutorApplicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api', tutorApplicationRoutes);
app.use('/api', adminRoutes);
// This code imports and uses tutor application and admin routes from separate files.
// It allows the server to handle requests related to tutor applications and admin functionalities.