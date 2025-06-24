// src/pages/tutor/ChangePassword.js
import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/TutorDashboard.css';

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const handleChange = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/tutors/change-password', {
        current,
        newPw,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(res.data.message || '✅ Password updated successfully.');
      setCurrent('');
      setNewPw('');
    } catch (err) {
      console.error('Error:', err);
      const errorMsg = err.response?.data?.error || '❌ Failed to change password. Please try again.';
      setMessage(errorMsg);
    }
  };

  return (
    <div style={pageWrapper}>
      <div style={card}>
        <h2 style={title}>🔐 Change Your Password</h2>
        <p style={subtitle}>Regularly updating your password helps keep your account safe.</p>

        <div style={form}>
          <input
            type="password"
            placeholder="Current Password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            style={input}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            style={input}
          />
          <button style={button} onClick={handleChange}>
            Update Password
          </button>
        </div>

        {message && <p style={feedback}>{message}</p>}
      </div>
    </div>
  );
}

// ✅ Inline styles to match the polished design
const pageWrapper = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '80vh',
  padding: '2rem',
  background: '#f9f9f9',
  padding: '15rem 27rem',
};

const card = {
  background: '#fff',
  padding: '2.5rem 3rem',
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
  maxWidth: '500px',
  width: '100%',
  textAlign: 'center',
};

const title = {
  fontSize: '1.8rem',
  marginBottom: '0.5rem',
};

const subtitle = {
  fontSize: '1rem',
  marginBottom: '1.5rem',
  color: '#666',
};

const form = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const input = {
  padding: '0.8rem 1rem',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '1rem',
};

const button = {
  background: '#1e8e3e',
  color: 'white',
  padding: '0.75rem',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const feedback = {
  marginTop: '1rem',
  color: '#555',
};

export default ChangePassword;
