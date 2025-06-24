import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // ✅ Import Toaster

import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import TutorProfile from './pages/TutorProfile';
import AdminDashboard from './pages/AdminDashboard';
import TutorDashboard from './pages/TutorDashboard';

import Login from './pages/Login';
import Register from './pages/Register';

import StudentDashboard from './pages/student/StudentDashboard';

function App() {
  return (
    <Router>
      {/* ✅ Global toast notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/student-dashboard/*" element={<StudentDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/tutor-dashboard/*" element={<TutorDashboard />} /> {/* ✅ Corrected path */}

        <Route path="/home" element={<Home />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
