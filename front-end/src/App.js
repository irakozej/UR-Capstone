import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TutorProfile from './pages/TutorProfile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
