import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-container">
      <div className="overlay">
        <div className="landing-content">
          <h1>Welcome to TutorConnect</h1>
          <p>Find expert tutors. Book personalized sessions. Learn with confidence.</p>
          <div className="landing-buttons">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-outline-light">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
