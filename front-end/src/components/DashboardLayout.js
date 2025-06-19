import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/DashboardLayout.css';

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}'); // Safe default

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const role = user.role || ''; // Default to empty string if undefined

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div>
          <h2>TutorConnect</h2>
          <nav>
            {role === 'student' && (
              <>
                <Link to="/student-dashboard">Dashboard</Link>
                <Link to="/">Find Tutors</Link>
              </>
            )}

            {role === 'tutor' && (
              <>
                <Link to="/tutor-dashboard">Dashboard</Link>
                <Link to="/tutor-sessions">My Sessions</Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link to="/admin-dashboard">Overview</Link>
                <Link to="/admin-users">Users</Link>
                <Link to="/admin-sessions">Sessions</Link>
                <Link to="/admin-analytics">Analytics</Link>
              </>
            )}
          </nav>
        </div>
        <button className="logout" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
