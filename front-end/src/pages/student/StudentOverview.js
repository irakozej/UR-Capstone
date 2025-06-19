import React from 'react';

function StudentOverview() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-2">🎉 Welcome, {user?.full_name || 'Student'}!</h2>
      <p className="text-gray-600 mb-4">This is your personalized dashboard where you can manage all your learning activities.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold text-lg">📌 Quick Tips</h3>
          <ul className="list-disc ml-5 mt-2 text-gray-700">
            <li>Use “Find Tutors” to explore top tutors</li>
            <li>Review upcoming sessions from your dashboard</li>
            <li>Check your feedback and update your profile</li>
          </ul>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold text-lg">📚 Learning Summary</h3>
          <p>📅 Keep an eye on your booked sessions</p>
          <p>💬 Leave feedback to help others</p>
          <p>📈 Track your progress over time</p>
        </div>
      </div>
    </div>
  );
}

export default StudentOverview;
