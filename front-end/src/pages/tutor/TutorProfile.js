// src/pages/tutor/TutorProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const token = localStorage.getItem('token');

function TutorProfile() {
  const [form, setForm] = useState({ bio: '', location: '', price: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/tutors/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm({
          bio: res.data.bio || '',
          location: res.data.location || '',
          price: res.data.price || ''
        });
        if (res.data.profile_picture) {
          setPreview(res.data.profile_picture);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        toast.error('❌ Failed to load profile.');
      }
    })();
  }, []);

  const handleSubmit = async () => {
    try {
      const fd = new FormData();
      fd.append('bio', form.bio);
      fd.append('location', form.location);
      fd.append('price', form.price);
      if (file) fd.append('profile', file);

      await axios.post('http://localhost:5000/api/tutors/profile', fd, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('✅ Profile updated successfully!');
    } catch (err) {
      console.error('Update failed', err);
      toast.error('❌ Failed to update profile');
    }
  };

  return (
    <div style={wrapper}>
      <Toaster position="top-center" />
      <div style={container}>
        <h2 style={heading}>👤 Your Tutor Profile</h2>
        <p style={description}>
          Keep your profile up-to-date to increase your chances of getting booked by students.
          Upload a clear photo, write a compelling bio, and set your rate.
        </p>

        {preview && (
          <div style={imageWrapper}>
            <img
              src={preview}
              alt="Profile"
              style={profilePic}
            />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setPreview(URL.createObjectURL(e.target.files[0]));
          }}
          style={input}
        />

        <textarea
          placeholder="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          style={textarea}
        />
        <input
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          style={input}
        />
        <input
          type="number"
          placeholder="Price per hour"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          style={input}
        />

        <button onClick={handleSubmit} style={button}>Update Profile</button>
      </div>
    </div>
  );
}

// ✅ Styling
const wrapper = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  padding: '2rem 25rem',
};

const container = {
  background: '#fff',
  padding: '3rem 3rem',
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
  width: '100%',
  maxWidth: '600px',
  textAlign: 'center'
};

const heading = {
  fontSize: '2rem',
  marginBottom: '0.25rem',
};

const description = {
  fontSize: '1rem',
  color: '#555',
  marginBottom: '1.5rem',
};

const input = {
  width: '100%',
  padding: '0.75rem',
  marginBottom: '1rem',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '1rem'
};

const textarea = {
  ...input,
  height: '100px',
  resize: 'vertical'
};

const button = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: '#28a745',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem'
};

const imageWrapper = {
  marginBottom: '1.5rem'
};

const profilePic = {
  width: '150px',
  height: '150px',
  objectFit: 'cover',
  borderRadius: '50%',
  border: '4px solid #ccc',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
};

export default TutorProfile;
