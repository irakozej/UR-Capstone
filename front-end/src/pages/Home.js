import React, { useEffect, useState } from 'react';
import TutorCard from '../components/TutorCard';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import '../styles/Home.css';

function Home() {
  const [tutors, setTutors] = useState([]);
  const [filters, setFilters] = useState({ subject: '', location: '', price: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tutors');
        setTutors(response.data);
      } catch (err) {
        console.error('Failed to load tutors:', err);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter(tutor =>
    (tutor.subject || '').toLowerCase().includes(filters.subject.toLowerCase()) &&
    (tutor.location || '').toLowerCase().includes(filters.location.toLowerCase()) &&
    (!filters.price || tutor.price <= parseFloat(filters.price))
  );

  const handleBookNow = (tutor) => {
    setSelectedTutor(tutor);
    setShowModal(true);
    setScheduledTime('');
    setBookingMessage('');
  };

  const handleBookingSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/sessions/book', {
        tutor_id: selectedTutor.id || 13,
        subject_id: selectedTutor.subject_id || 2,
        scheduled_time: scheduledTime,
      }, {
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzQ4NzcwODkyfQ.aZwlUjCUnjBAqiPjnDqSeoNabgr5prAj3f_pKtnrUIg',
          'Content-Type': 'application/json'
        }
      });

      setBookingMessage('✅ Session booked!');
    } catch (err) {
      console.error(err);
      setBookingMessage('❌ Booking failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div className="container py-5">
      <div className="hero-section">
        <h1>🎓 Find the Best Tutors Online</h1>
        <p>Search by subject, location, or price to find the perfect match!</p>
      </div>

      <div className="row justify-content-center mb-4">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search subject..."
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          />
        </div>
        <div className="col-md-3 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Location..."
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
        </div>
        <div className="col-md-3 mb-2">
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
            <TutorCard tutor={tutor} onBook={handleBookNow} />
          </div>
        ))}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Book with {selectedTutor?.full_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Select Time</Form.Label>
              <Form.Control
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </Form.Group>
            {bookingMessage && <p className="mt-3">{bookingMessage}</p>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleBookingSubmit}>Confirm Booking</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Home;
