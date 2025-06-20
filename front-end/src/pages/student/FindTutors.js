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
        console.log("Fetched tutors:", res.data); // ✅ Debugging aid
        setTutors(res.data);
      } catch (err) {
        console.error('Failed to fetch tutors', err);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter((tutor) => {
    const subjectMatch = filters.subject
      ? (tutor.subject || '').toLowerCase().includes(filters.subject.toLowerCase())
      : true;

    const locationMatch = filters.location
      ? (tutor.location || '').toLowerCase().includes(filters.location.toLowerCase())
      : true;

    const priceMatch = filters.price
      ? parseFloat(tutor.price) <= parseFloat(filters.price)
      : true;

    return subjectMatch && locationMatch && priceMatch;
  });

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
        {filteredTutors.length > 0 ? (
          filteredTutors.map((tutor, index) => (
            <div className="col-md-6 col-lg-4" key={index}>
              <TutorCard tutor={tutor} onBook={() => {}} />
            </div>
          ))
        ) : (
          <p className="text-muted">No tutors found. Try adjusting filters.</p>
        )}
      </div>
    </div>
  );
}

export default FindTutors;
