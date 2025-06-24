// src/pages/tutor/Availability.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/TutorDashboard.css';

const token = localStorage.getItem('token');
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function Availability() {
  const [slots, setSlots] = useState([]);
  const [day, setDay] = useState('Monday');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [message, setMessage] = useState('');

  const fetchAvailability = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tutors/me/availability', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to load availability:', err);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleAddOrUpdate = () => {
    if (!start || !end) {
      return setMessage('Start and end times are required');
    }

    const newSlot = { day_of_week: day, start_time: start, end_time: end };

    if (editingIndex !== null) {
      const updated = [...slots];
      updated[editingIndex] = newSlot;
      setSlots(updated);
      setEditingIndex(null);
    } else {
      setSlots([...slots, newSlot]);
    }

    setDay('Monday');
    setStart('');
    setEnd('');
    setMessage('');
  };

  const handleEdit = (index) => {
    const slot = slots[index];
    setDay(slot.day_of_week);
    setStart(slot.start_time);
    setEnd(slot.end_time);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    const updated = [...slots];
    updated.splice(index, 1);
    setSlots(updated);
  };

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:5000/api/tutors/availability', { slots }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Availability saved successfully');
    } catch (err) {
      console.error('Failed to save availability', err);
      setMessage('❌ Failed to save availability');
    }
  };

  return (
    <div style={pageWrapper}>
      <div style={card}>
        <h2 style={title}>📅 Manage Weekly Availability</h2>
        <p style={subtitle}>
          Add or update your availability so students can book sessions that fit your schedule.
        </p>

        <div style={form}>
          <select value={day} onChange={(e) => setDay(e.target.value)} style={select}>
            {weekdays.map(d => <option key={d}>{d}</option>)}
          </select>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={input} />
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={input} />
          <button onClick={handleAddOrUpdate} style={addButton}>
            {editingIndex !== null ? 'Update' : 'Add'}
          </button>
        </div>

        <ul style={list}>
          {slots.map((slot, index) => (
            <li key={index} style={listItem}>
              <div>
                <strong>{slot.day_of_week}</strong>: {slot.start_time} - {slot.end_time}
              </div>
              <div style={buttonGroup}>
                <button onClick={() => handleEdit(index)} style={editBtn}>Edit</button>
                <button onClick={() => handleDelete(index)} style={deleteBtn}>Delete</button>
              </div>
            </li>
          ))}
        </ul>

        <button onClick={handleSave} style={saveButton}>💾 Save Availability</button>
        {message && <p style={messageStyle}>{message}</p>}
      </div>
    </div>
  );
}

export default Availability;
const pageWrapper = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '4rem 23rem',
  backgroundColor: '#f7f9fb',
  minHeight: '100vh',
};

const card = {
  background: '#fff',
  padding: '3rem',
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
  maxWidth: '600px',
  width: '100%',
  marginLeft: '4rem' // pushes it slightly right
};

const title = {
  fontSize: '1.8rem',
  marginBottom: '0.5rem',
};

const subtitle = {
  color: '#555',
  marginBottom: '2rem',
};

const form = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
  marginBottom: '1.5rem',
};

const select = {
  flex: '1',
  padding: '0.6rem',
  borderRadius: '8px',
  border: '1px solid #ccc',
};

const input = {
  flex: '1',
  padding: '0.6rem',
  borderRadius: '8px',
  border: '1px solid #ccc',
};

const addButton = {
  backgroundColor: '#007bff',
  color: '#fff',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const list = {
  listStyle: 'none',
  padding: 0,
  marginBottom: '1.5rem',
};

const listItem = {
  display: 'flex',
  justifyContent: 'space-between',
  background: '#f1f3f5',
  padding: '1rem',
  borderRadius: '10px',
  marginBottom: '0.75rem',
};

const buttonGroup = {
  display: 'flex',
  gap: '0.5rem',
};

const editBtn = {
  backgroundColor: '#ffc107',
  color: '#000',
  border: 'none',
  padding: '0.4rem 0.75rem',
  borderRadius: '6px',
  cursor: 'pointer',
};

const deleteBtn = {
  backgroundColor: '#dc3545',
  color: '#fff',
  border: 'none',
  padding: '0.4rem 0.75rem',
  borderRadius: '6px',
  cursor: 'pointer',
};

const saveButton = {
  backgroundColor: '#28a745',
  color: '#fff',
  width: '100%',
  padding: '0.8rem',
  fontSize: '1rem',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const messageStyle = {
  marginTop: '1rem',
  textAlign: 'center',
  color: '#444',
  fontSize: '0.95rem',
};
