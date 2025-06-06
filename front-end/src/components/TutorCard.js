import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/TutorCard.css';

function TutorCard({ tutor, onBook }) {
  return (
    <div className="tutor-card-wrapper">
      <Link to={`/tutors/${tutor.id}`} className="tutor-link">
        <div className="card tutor-card shadow-sm">
          {tutor.profile_picture && (
            <img
              src={tutor.profile_picture}
              alt={`${tutor.full_name}'s profile`}
              className="card-img-top tutor-img"
            />
          )}
          <div className="card-body">
            <h5 className="card-title text-primary fw-bold">{tutor.full_name}</h5>
            <p className="card-text text-muted small mb-2">{tutor.bio}</p>
            <div className="d-flex justify-content-between">
              <span className="badge bg-success">{tutor.subject}</span>
              <span className="text-muted">💵 ${tutor.price || tutor.pricing || 0}/hr</span>
            </div>
          </div>
        </div>
      </Link>
      <button className="btn btn-outline-primary w-100 mt-2" onClick={() => onBook(tutor)}>
        Book Now
      </button>
    </div>
  );
}

export default TutorCard;
