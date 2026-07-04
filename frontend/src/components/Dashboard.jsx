import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/stats`),
        axios.get(`${API_BASE}/api/reports`)
      ]);
      setStats(statsRes.data);
      setRecentReports(reportsRes.data.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🏙️ CivicSync AI Dashboard</h1>
      <p className="text-gray-600 mb-8">Real-time urban intelligence for smarter cities.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-3xl font-bold text-primary">{stats?.total_reports || 0}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>
        <div className="card bg-gradient-to-r from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-3xl font-bold text-red-600">{stats?.high_priority || 0}</p>
            </div>
            <div className="text-4xl">🚨</div>
          </div>
        </div>
        <div className="card bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats?.resolved || 0}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
        <div className="card bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-3xl font-bold text-purple-600">{Object.keys(stats?.categories || {}).length}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      {stats?.categories && Object.keys(stats.categories).length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Issue Categories</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.categories).map(([category, count]) => (
              <span key={category} className="px-4 py-2 bg-gray-100 rounded-full text-sm">
                {category}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/report" className="btn btn-primary">📝 Report an Issue</Link>
          <Link to="/parking" className="btn btn-success">🅿️ Find Parking</Link>
          <Link to="/reports" className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">📋 View All Reports</Link>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Reports</h2>
          <Link to="/reports" className="text-blue-600 hover:underline text-sm">View all →</Link>
        </div>
        {recentReports.length === 0 ? (
          <p className="text-gray-500">No reports submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-gray-600">{report.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${report.priority === 'High' ? 'bg-red-100 text-red-700' :
                      report.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'}`}>
                    {report.priority}
                  </span>
                  <span className="text-sm text-gray-500">{report.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;