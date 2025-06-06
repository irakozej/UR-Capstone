import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

function TutorProfile() {
  const { id } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [availability, setAvailability] = useState([]);
  const [tutor, setTutor] = useState(null);
  const [reviews, setReviews] = useState([]);

  const navigate = useNavigate();

  const handleBookNow = () => {
    setShowModal(true);
    setScheduledTime('');
    setBookingMessage('');
  };

  const handleBookingSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/sessions/book', {
        tutor_id: tutor.id,
        subject_id: tutor.subject_id || 2,
        scheduled_time: scheduledTime
      }, {
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzQ4NzcwODkyfQ.aZwlUjCUnjBAqiPjnDqSeoNabgr5prAj3f_pKtnrUIg',
          'Content-Type': 'application/json'
        }
      });

      setBookingMessage('✅ Session booked successfully!');
    } catch (err) {
      console.error(err);
      setBookingMessage('❌ Booking failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  useEffect(() => {
    const fetchTutor = async () => {
      const res = await axios.get(`http://localhost:5000/api/tutors/${id}`);
      setTutor(res.data);
    };

    const fetchReviews = async () => {
      const res = await axios.get(`http://localhost:5000/api/tutors/${id}/reviews`);
      setReviews(res.data);
    };

    const fetchAvailability = async () => {
      const res = await axios.get(`http://localhost:5000/api/tutors/${id}/availability`);
      setAvailability(res.data);
    };

    fetchTutor();
    fetchReviews();
    fetchAvailability();
  }, [id]);

  if (!tutor) return <div>Loading...</div>;

  return (
    <div className="container py-5">
      <h2>{tutor.full_name}</h2>
      {tutor.profile_picture && (
        <img src={tutor.profile_picture} alt="profile" style={{ width: '200px', borderRadius: '10px' }} />
      )}
      <p><strong>Subject:</strong> {tutor.subject}</p>
      <p><strong>Experience:</strong> {tutor.experience_years} years</p>
      <p><strong>Rating:</strong> {tutor.rating}</p>
      <p><strong>Bio:</strong> {tutor.bio}</p>

      <h4 className="mt-4">Student Reviews:</h4>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <ul>
          {reviews.map(r => (
            <li key={r.id}>
              ⭐ {r.rating} – "{r.comment}" – <i>{r.student_name}</i>
            </li>
          ))}
        </ul>
      )}

      <Button variant="primary" className="mt-3" onClick={handleBookNow}>
        Book Now
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Book a Session with {tutor.full_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Select Time</Form.Label>
              <small className="text-muted d-block mb-2">
                Only available times can be selected. Based on tutor schedule.
              </small>
              <Form.Control
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => {
                  const selected = new Date(e.target.value);
                  const day = selected.toLocaleString('en-US', { weekday: 'long' });
                  const time = selected.toTimeString().split(':').slice(0, 2).join(':') + ':00';

                  const match = availability.find(
                    slot =>
                      slot.day_of_week === day &&
                      slot.start_time <= time &&
                      slot.end_time > time
                  );

                  if (match) {
                    setScheduledTime(e.target.value);
                    setBookingMessage('');
                  } else {
                    setScheduledTime('');
                    setBookingMessage('❌ Tutor is not available at this time. Please select a different slot.');
                  }
                }}
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

export default TutorProfile;
