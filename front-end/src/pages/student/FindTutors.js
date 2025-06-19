// src/pages/student/FindTutors.js
import React, { useEffect, useState } from 'react';
import TutorCard from '../../components/TutorCard';
import axios from 'axios';
import '../../styles/Home.css';

function FindTutors() {
  const [tutors, setTutors] = useState([]);
  const [filters, setFilters] = useState({ subject: '', location: '', price: '' });

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/tutors');
        setTutors(res.data);
      } catch (err) {
        console.error('Failed to fetch tutors', err);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter(tutor =>
    (tutor.subject || '').toLowerCase().includes(filters.subject.toLowerCase()) &&
    (tutor.bio || '').toLowerCase().includes(filters.location.toLowerCase()) &&
    (!filters.price || tutor.price <= parseFloat(filters.price))
  );

  return (
    <div className="container py-4">
      <h2 className="mb-4">🔍 Explore Tutors</h2>
      <div className="row mb-4">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Subject"
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          />
        </div>
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
        </div>
        <div className="col-md-4 mb-2">
          <input
            type="number"
            className="form-control"
            placeholder="Max Price"
            value={filters.price}
            onChange={(e) => setFilters({ ...filters, price: e.target.value })}
          />
        </div>
      </div>

      <div className="row">
        {filteredTutors.map((tutor, index) => (
          <div className="col-md-6 col-lg-4" key={index}>
            <TutorCard tutor={tutor} onBook={() => {}} />
            
          </div>
        ))}
      </div>
    </div>
  );
}

export default FindTutors;
