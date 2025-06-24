// src/pages/tutor/TutorProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/TutorDashboard.css';

function TutorProfile() {
  const [form, setForm] = useState({ bio: '', location: '', price: '' });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/tutors/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm(res.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, [token]);

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (file) formData.append('profile', file);

      await axios.post('http://localhost:5000/api/tutors/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('✅ Profile updated successfully.');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage('❌ Failed to update profile.');
    }
  };

  return (
    <div className="tutor-content">
      <h2 className="section-title">👤 Your Profile</h2>
      <p className="section-description">Update your location, hourly rate, and bio. Keep your profile attractive and up to date!</p>

      <div className="profile-form">
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Write your bio here..."
          rows={4}
        />
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Location (e.g., Kigali)"
        />
        <input
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="Price per hour (USD)"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept="image/*"
        />
        <button onClick={handleSubmit} className="primary-btn">Update Profile</button>
        {message && <p className="feedback-msg">{message}</p>}
      </div>
    </div>
  );
}

export default TutorProfile;
