import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import Home from './pages/Home'; // Optional: main tutor discovery page
import TutorProfile from './pages/TutorProfile';
import AdminDashboard from './pages/AdminDashboard';
import TutorDashboard from './pages/TutorDashboard';

import Login from './pages/Login';
import Register from './pages/Register';

// ✅ Updated import path for StudentDashboard
import StudentDashboard from './pages/student/StudentDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Unique and correct dashboards */}
        <Route path="/student-dashboard/*" element={<StudentDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/tutor-dashboard" element={<TutorDashboard />} />

        <Route path="/home" element={<Home />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
