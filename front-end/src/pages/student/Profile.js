import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/StudentProfile.css';

function Profile() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    learning_style: '',
    bio: '',
    location: '',
  });
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        learning_style: user.learning_style || '',
        bio: user.bio || '',
        location: user.location || '',
      });
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/students/profile', form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('✅ Profile updated successfully');
      localStorage.setItem(
        'user',
        JSON.stringify({ ...JSON.parse(localStorage.getItem('user')), ...form })
      );
      setEditing(false);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to update profile');
    }
  };

  return (
    <div className="student-profile-container">
      <h2>👤 Student Profile</h2>

      {message && <p className="feedback-msg">{message}</p>}

      <form onSubmit={handleUpdate} className="profile-form">
        <label>Full Name</label>
        <input
          type="text"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          disabled={!editing}
        />

        <label>Email (read-only)</label>
        <input type="email" value={form.email} disabled />

        <label>Learning Style</label>
        <input
          type="text"
          name="learning_style"
          value={form.learning_style}
          onChange={handleChange}
          disabled={!editing}
        />

        <label>Location</label>
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          disabled={!editing}
        />

        <label>Bio</label>
        <textarea
          name="bio"
          rows="4"
          value={form.bio}
          onChange={handleChange}
          disabled={!editing}
        />

        {editing ? (
          <div className="profile-buttons">
            <button type="submit" className="btn-save">Save</button>
            <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="btn-edit" onClick={() => setEditing(true)}>
            ✏️ Edit Profile
          </button>
        )}
      </form>
    </div>
  );
}

export default Profile;
