import React from 'react';
import { useNavigate } from 'react-router-dom';

function TutorOverview() {
  const navigate = useNavigate();
  const tutor = JSON.parse(localStorage.getItem('user'));

  return (
    <div style={container}>
      <h2 style={title}>🎓 Welcome back, {tutor?.full_name?.split(' ')[0] || 'Tutor'}!</h2>
      <p style={subtitle}>
        Manage your tutoring profile, set your availability, and track sessions from here.
      </p>

      <div style={cardList}>
        <div style={card} onClick={() => navigate('/tutor-dashboard/availability')}>
          <h3>📅 Availability</h3>
          <p>Update when you're available for sessions.</p>
        </div>
        <div style={card} onClick={() => navigate('/tutor-dashboard/sessions')}>
          <h3>📚 Upcoming Sessions</h3>
          <p>View and manage your scheduled sessions.</p>
        </div>
        <div style={card} onClick={() => navigate('/tutor-dashboard/profile')}>
          <h3>👤 Profile</h3>
          <p>Keep your profile up to date for better visibility.</p>
        </div>
        <div style={card} onClick={() => navigate('/tutor-dashboard/password')}>
          <h3>🔐 Security</h3>
          <p>Change your password to keep your account secure.</p>
        </div>
      </div>
    </div>
  );
}

// ✅ Styling objects
const container = {
  margin: '0 auto',
  padding: '5rem 20rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '@media (max-width: 768px)': {
    padding: '2rem 1rem',
    width: '100%',
    margin: '0 auto',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: '2rem',
    paddingTop: '3rem',
    paddingBottom: '3rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  },
};
const title = {
  fontSize: '2.2rem',
  marginBottom: '0.5rem',
};

const subtitle = {
  marginBottom: '2.5rem',
  textAlign: 'center',
  fontSize: '1.1rem',
  color: '#444',
};

const cardList = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const card = {
  background: '#fff',
  padding: '1.5rem 2rem',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  width: '100%',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  border: '1px solid #ddd',
};

card[':hover'] = {
  transform: 'scale(1.02)',
  boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
};

export default TutorOverview;
