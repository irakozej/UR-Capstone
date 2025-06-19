import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import '../../styles/DashboardLayout.css';
import FindTutors from './FindTutors';
import UpcomingSessions from './UpcomingSessions';
import Profile from './Profile';
import StudentOverview from './StudentOverview';

function StudentDashboard() {
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
          <button onClick={() => navigate('/student-dashboard')} className="nav-btn">Overview</button>
          <button onClick={() => navigate('/student-dashboard/find-tutors')} className="nav-btn">Find Tutors</button>
          <button onClick={() => navigate('/student-dashboard/upcoming-sessions')} className="nav-btn">Upcoming Sessions</button>
          <button onClick={() => navigate('/student-dashboard/profile')} className="nav-btn">Profile</button>
        </nav>
        <div className="logout-section">
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </aside>

      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<StudentOverview />} />
          <Route path="find-tutors" element={<FindTutors />} />
          <Route path="upcoming-sessions" element={<UpcomingSessions />} />
          <Route path="profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default StudentDashboard;
