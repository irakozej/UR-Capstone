// src/pages/TutorDashboard.js
import React from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import '../styles/StudentDashboard.css';

import TutorOverview from './tutor/TutorOverview';
import Availability from './tutor/Availability';
import Sessions from './tutor/Sessions';
import TutorProfile from './tutor/TutorProfile';
import ChangePassword from './tutor/ChangePassword';

function TutorDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">TutorConnect</div>
        <nav className="sidebar-nav">
          <button className="nav-btn" onClick={() => navigate('/tutor-dashboard')}>Dashboard</button>
          <button className="nav-btn" onClick={() => navigate('/tutor-dashboard/availability')}>Availability</button>
          <button className="nav-btn" onClick={() => navigate('/tutor-dashboard/sessions')}>Upcoming Sessions</button>
          <button className="nav-btn" onClick={() => navigate('/tutor-dashboard/profile')}>Profile</button>
          <button className="nav-btn" onClick={() => navigate('/tutor-dashboard/password')}>Change Password</button>
        </nav>
        <div className="logout-section">
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </aside>

      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<TutorOverview />} />
          <Route path="availability" element={<Availability />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="profile" element={<TutorProfile />} />
          <Route path="password" element={<ChangePassword />} />
        </Routes>
      </main>
    </div>
  );
}

export default TutorDashboard;
