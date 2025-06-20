import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    bio: '',
    location: '',
    subject: '',
    price: '',
    learning_style: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = role === 'tutor' ? '/api/tutors/apply' : '/api/auth/signup';

    try {
      if (role === 'tutor') {
        // Use FormData for tutor
        const formData = new FormData();
        for (const key in form) {
          if (form[key]) formData.append(key, form[key]);
        }
        if (profilePic) formData.append('profile_picture', profilePic);

        await axios.post(`http://localhost:5000${endpoint}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setMessage('✅ Application submitted. Await approval.');
      } else {
        // Use JSON for student
        const payload = {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          learning_style: form.learning_style,
        };

        await axios.post(`http://localhost:5000${endpoint}`, payload);

        setMessage('✅ Signup successful! Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Signup failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{role === 'tutor' ? 'Tutor Signup' : 'Student Signup'}</h2>

        <div className="role-toggle">
          <button
            className={role === 'student' ? 'active' : ''}
            onClick={() => setRole('student')}
          >Student</button>
          <button
            className={role === 'tutor' ? 'active' : ''}
            onClick={() => setRole('tutor')}
          >Tutor</button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {role === 'student' && (
            <input
              type="text"
              name="learning_style"
              placeholder="Learning style"
              value={form.learning_style}
              onChange={handleChange}
            />
          )}

          {role === 'tutor' && (
            <>
              <textarea
                name="bio"
                placeholder="Your bio..."
                value={form.bio}
                onChange={handleChange}
                required
                rows={3}
              />
              <input
                type="text"
                name="location"
                placeholder="Location (e.g., Kigali)"
                value={form.location}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="subject"
                placeholder="Subject you teach"
                value={form.subject}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="price"
                placeholder="Price per hour ($)"
                value={form.price}
                onChange={handleChange}
                required
              />
              <input
                type="file"
                name="profile_picture"
                onChange={(e) => setProfilePic(e.target.files[0])}
                accept="image/*"
              />
            </>
          )}

          <button type="submit">Sign Up</button>
        </form>

        {message && <p className="feedback-msg">{message}</p>}
      </div>
    </div>
  );
}

export default Register;
