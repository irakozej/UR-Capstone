// src/pages/TutorDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Routes, Route } from 'react-router-dom';
import '../styles/StudentDashboard.css';

const token = localStorage.getItem('token');

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
          <Route path="availability" element={<Availability />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="profile" element={<TutorProfile />} />
          <Route path="password" element={<ChangePassword />} />
        </Routes>
      </main>
    </div>
  );
}

function Availability() {
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');

  const fetchAvailability = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tutors/me/availability', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch availability', err);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/tutors/availability', { slots }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Availability updated');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to update availability');
    }
  };

  return (
    <div>
      <h3>Update Availability</h3>
      {/* Simple input for slot management */}
      <textarea value={JSON.stringify(slots, null, 2)} onChange={e => setSlots(JSON.parse(e.target.value))} rows={10} style={{ width: '100%' }} />
      <button onClick={handleSubmit} className="btn btn-primary mt-2">Save</button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState('');

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
      setMessage('Session cancelled');
      fetchSessions();
    } catch (err) {
      console.error('Failed to cancel session', err);
      setMessage('❌ Could not cancel session');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div>
      <h3>Upcoming Sessions</h3>
      {message && <p>{message}</p>}
      <ul>
        {sessions.map(sess => (
          <li key={sess.id}>
            With: {sess.student_name}, Subject: {sess.subject}, Time: {new Date(sess.scheduled_time).toLocaleString()}
            <button onClick={() => cancelSession(sess.id)} style={{ marginLeft: '1rem', color: 'red' }}>Cancel</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TutorProfile() {
  const [form, setForm] = useState({ bio: '', location: '', price: '' });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const res = await axios.get('http://localhost:5000/api/tutors/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm(res.data);
    })();
  }, []);

  const handleSubmit = async () => {
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      if (file) fd.append('profile', file);
      await axios.post('http://localhost:5000/api/tutors/profile', fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Profile updated');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to update profile');
    }
  };

  return (
    <div>
      <h3>Your Profile</h3>
      <input type="text" placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
      <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
      <input type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleSubmit}>Update Profile</button>
      {message && <p>{message}</p>}
    </div>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');

  const handleChange = async () => {
    try {
      await axios.post('http://localhost:5000/api/tutors/change-password', { current, newPw }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg('✅ Password updated');
    } catch (err) {
      console.error(err);
      setMsg('❌ Failed to change password');
    }
  };

  return (
    <div>
      <h3>Change Password</h3>
      <input type="password" placeholder="Current password" value={current} onChange={e => setCurrent(e.target.value)} />
      <input type="password" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} />
      <button onClick={handleChange}>Update</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}

export default TutorDashboard;
