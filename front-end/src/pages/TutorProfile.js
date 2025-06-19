import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import '../styles/TutorProfile.css'; // Make sure this file exists

function TutorProfile() {
  const { id } = useParams();
  const [tutor, setTutor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  const fetchTutor = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutors/${id}`);
      setTutor(res.data);
    } catch (err) {
      console.error('Failed to load tutor:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutors/${id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutors/${id}/availability`);
      setAvailability(res.data);
    } catch (err) {
      console.error('Failed to load availability:', err);
    }
  };

  useEffect(() => {
    fetchTutor();
    fetchReviews();
    fetchAvailability();
  }, [id]);

  const handleBookNow = () => {
    setShowModal(true);
    setScheduledTime('');
    setBookingMessage('');
  };

  const handleBookingSubmit = async () => {
    const selectedDate = new Date(scheduledTime);
    const now = new Date();

    if (selectedDate <= now) {
      setBookingMessage('❌ You cannot book a session in the past.');
      return;
    }

    // Optional: Check if the selected time matches any availability slot
    const selectedDay = selectedDate.getDay();
    const selectedHour = selectedDate.getHours();

    const isAvailable = availability.some(slot => {
      const start = parseInt(slot.start_time.split(':')[0]);
      const end = parseInt(slot.end_time.split(':')[0]);
      return slot.day_of_week === selectedDay && selectedHour >= start && selectedHour < end;
    });

    if (!isAvailable) {
      setBookingMessage("❌ This time is outside the tutor's availability.");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/sessions/book', {
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

  if (!tutor) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container py-5">
      <h2>{tutor.full_name}</h2>
      {tutor.profile_picture && (
        <img
          src={tutor.profile_picture}
          alt="profile"
          className="tutor-profile-picture"
        />
      )}
      <p><strong>Subject:</strong> {tutor.subject}</p>
      <p><strong>Price:</strong> ${tutor.price || tutor.pricing || 0}/hour</p>
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

export default TutorProfile;
