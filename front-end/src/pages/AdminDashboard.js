import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';
import DashboardLayout from '../components/DashboardLayout';

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [view, setView] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  const fetchUsers = async (role) => {
    setLoading(true);
    setView(role);
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/${role}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error(`Failed to fetch ${role}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setView('sessions');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    setView('pending-tutors');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/pending-tutors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/approve-tutor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(data.filter(app => app.id !== id));
      fetchStats(); // refresh stat cards
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const rejectApplication = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/reject-tutor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(data.filter(app => app.id !== id));
      fetchStats(); // refresh stat cards
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="admin-dashboard">
        <h2 className="dashboard-title">Admin Dashboard</h2>

        <div className="dashboard-cards">
          <div className="dashboard-card" onClick={() => fetchUsers('tutors')}>
            <h4>Total Tutors</h4>
            <p>{stats.total_tutors}</p>
          </div>
          <div className="dashboard-card" onClick={fetchApplications}>
            <h4>Pending Tutors</h4>
            <p>{stats.total_pending || 'N/A'}</p>
          </div>
          <div className="dashboard-card" onClick={() => fetchUsers('students')}>
            <h4>Total Students</h4>
            <p>{stats.total_students}</p>
          </div>
          <div className="dashboard-card" onClick={fetchSessions}>
            <h4>Total Sessions</h4>
            <p>{stats.total_sessions}</p>
          </div>
        </div>

        <div className="dashboard-table">
          {loading ? (
            <p>Loading...</p>
          ) : view === 'pending-tutors' ? (
            <>
              <h3>Pending Tutor Applications</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(app => (
                    <tr key={app.id}>
                      <td>{app.full_name}</td>
                      <td>{app.email}</td>
                      <td>{app.subject}</td>
                      <td>${app.price}/hr</td>
                      <td>
                        <button onClick={() => approveApplication(app.id)} className="btn-approve">
                          ✅ Approve
                        </button>
                        <button onClick={() => rejectApplication(app.id)} className="btn-reject">
                          ❌ Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : view === 'tutors' ? (
            <>
              <h3>Approved Tutors</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(user => (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>{user.subject}</td>
                      <td>${user.price}/hr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : view === 'students' ? (
            <>
              <h3>Students</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Learning Style</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(user => (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>{user.learning_style}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : view === 'sessions' ? (
            <>
              <h3>All Sessions</h3>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Tutor</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(session => (
                    <tr key={session.id}>
                      <td>{session.student}</td>
                      <td>{session.tutor}</td>
                      <td>{session.subject}</td>
                      <td>{session.status}</td>
                      <td>{new Date(session.scheduled_time).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>Select a section above to view data.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
