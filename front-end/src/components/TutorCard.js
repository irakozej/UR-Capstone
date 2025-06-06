import React from 'react';

function TutorCard({ tutor, onBook }) {
  return (
    <div className="card mb-3">
      {tutor.profile_picture && (
        <img
          src={tutor.profile_picture}
          alt={`${tutor.full_name}'s profile`}
          className="card-img-top"
          style={{ height: '250px', objectFit: 'cover' }}
        />
      )}
      <div className="card-body">
        <h5 className="card-title">{tutor.full_name}</h5>
        <p className="card-text">{tutor.bio}</p>
        <p className="card-text"><strong>Subject:</strong> {tutor.subject}</p>
        <p className="card-text"><strong>Price:</strong> ${tutor.price || tutor.pricing || 0}/hr</p>
        <button className="btn btn-primary" onClick={() => onBook(tutor)}>
          Book Now
        </button>
      </div>
    </div>
  );
}

export default TutorCard;
