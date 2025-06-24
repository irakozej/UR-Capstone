// src/pages/tutor/Sessions.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/TutorDashboard.css';

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tutors/me/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  };

  const cancelSession = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/tutors/sessions/${id}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Session cancelled successfully.');
      fetchSessions();
    } catch (err) {
      console.error('Failed to cancel session', err);
      setMessage('❌ Could not cancel session.');
    }
  };

  return (
    <div className="tutor-content">
      <h2 className="section-title">📚 Upcoming Sessions</h2>
      <p className="section-description">Review and manage your upcoming sessions with students.</p>
      {message && <p className="feedback-msg">{message}</p>}

      {sessions.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>No sessions scheduled yet.</p>
      ) : (
        <table className="styled-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Subject</th>
              <th>Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(sess => (
              <tr key={sess.id}>
                <td>{sess.student_name}</td>
                <td>{sess.subject}</td>
                <td>{new Date(sess.scheduled_time).toLocaleString()}</td>
                <td>{sess.status}</td>
                <td>
                  <button
                    className="cancel-btn"
                    onClick={() => cancelSession(sess.id)}>
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Sessions;