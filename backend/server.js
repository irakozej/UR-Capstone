require('dotenv').config();
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
// It also imports and uses authentication routes from aconst reviewRoutes = require separate file.
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

const studentRoutes = require('./routes/studentRoutes');
app.use('/api', studentRoutes);
// This code imports and uses student routes from a separate file.
// It allows the server to handle requests related to student functionalities, such as fetching tutors and managing student-related data.

const sessionRoutes = require('./routes/sessionRoutes');
app.use('/api', sessionRoutes);
// This code imports and uses session routes from a separate file.
// It allows the server to handle requests related to booking and managing tutoring sessions, both for students and tutors.

const tutorRoutes = require('./routes/tutorRoutes');
app.use('/api', tutorRoutes);



// Serve images statically
app.use('/uploads', express.static('uploads'));
// This code imports and uses tutor routes from a separate file.

const sendEmail = require('./utils/sendEmail');
const pool = require('./models/db');

setInterval(async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const result = await pool.query(`
      SELECT s.id, s.scheduled_time, u.email AS student_email, u.full_name AS student_name,
             t.email AS tutor_email, t.full_name AS tutor_name
      FROM sessions s
      JOIN users u ON s.student_id = u.id
      JOIN users t ON s.tutor_id = t.id
      WHERE s.status = 'scheduled'
        AND s.scheduled_time BETWEEN $1 AND $2
        AND s.reminder_sent IS NOT TRUE
    `, [now.toISOString(), oneHourLater.toISOString()]);

    for (const session of result.rows) {
      // Send student reminder
      await sendEmail({
        to: session.student_email,
        subject: '⏰ Reminder: Upcoming Session in 1 Hour',
        text: `Hi ${session.student_name},\n\nJust a reminder that your session with ${session.tutor_name} is scheduled at ${session.scheduled_time}.\n\nBe prepared!`
      });

      // Send tutor reminder
      await sendEmail({
        to: session.tutor_email,
        subject: '⏰ Reminder: Upcoming Session in 1 Hour',
        text: `Hi ${session.tutor_name},\n\nYou have a session with ${session.student_name} at ${session.scheduled_time}. Please be ready.`
      });

      // Mark reminder as sent
      await pool.query(`UPDATE sessions SET reminder_sent = TRUE WHERE id = $1`, [session.id]);
    }

  } catch (err) {
    console.error('Reminder check failed:', err);
  }
}, 60 * 1000); // every 60 seconds
