import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UpcomingSessions() {
  const [sessions, setSessions] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/student/upcoming-sessions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSessions(res.data);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      }
    };

    fetchSessions();
  }, [token]);

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">📅 Upcoming Sessions</h3>
      {sessions.length === 0 ? (
        <p>No upcoming sessions.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map(session => (
            <li key={session.id} className="border p-4 rounded shadow-sm bg-white">
              <p><strong>🧑 Tutor:</strong> {session.tutor_name}</p>
              <p><strong>📚 Subject:</strong> {session.subject}</p>
              <p><strong>🕒 Time:</strong> {new Date(session.scheduled_time).toLocaleString()}</p>
              <p><strong>Status:</strong> {session.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UpcomingSessions;
