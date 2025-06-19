import React from 'react';
import '../styles/AvailabilityPreview.css';

function AvailabilityPreview({ availability }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="availability-preview">
      <h5 className="mb-3">🕒 Weekly Availability</h5>
      <div className="slots-grid">
        {days.map(day => {
          const daySlots = availability.filter(slot => slot.day_of_week === day);
          return (
            <div key={day} className="day-column">
              <strong>{day}</strong>
              {daySlots.length === 0 ? (
                <div className="no-slots">Unavailable</div>
              ) : (
                daySlots.map((slot, i) => (
                  <div key={i} className="slot">
                    {slot.start_time} - {slot.end_time}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AvailabilityPreview;
