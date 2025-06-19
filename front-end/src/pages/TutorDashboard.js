import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axios from 'axios';

function TutorDashboard() {
  const [tutor, setTutor] = useState(null);
  const [sessions, setSessions] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setTutor(user);

    const fetchSessions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sessions/my?tutor=1', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSessions(res.data);
      } catch (err) {
        console.error('Failed to fetch tutor sessions', err);
      }
    };

    fetchSessions();
  }, [token]);

  return (
    <DashboardLayout>
      <h2>Welcome, {tutor?.full_name}</h2>
      <p><strong>Email:</strong> {tutor?.email}</p>
      <p><strong>Role:</strong> {tutor?.role}</p>

      <h4 className="mt-4">📅 Your Upcoming Sessions</h4>
      {sessions.length === 0 ? (
        <p>No upcoming sessions.</p>
      ) : (
        <ul className="list-group">
          {sessions.map((s) => (
            <li className="list-group-item" key={s.id}>
              {new Date(s.scheduled_time).toLocaleString()} — with student #{s.student_id}
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}

export default TutorDashboard;
