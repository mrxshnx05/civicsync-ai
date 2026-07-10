import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Stat Card Component with 3D tilt
const StatCard = ({ icon, label, value, color, delay }) => {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotate({
      x: ((y - centerY) / centerY) * 5,
      y: ((x - centerX) / centerX) * 5,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="glass-card p-6 cursor-hover"
      style={{
        transform: `perspective(600px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-3xl font-bold gradient-text mt-1">{value}</p>
        </div>
        <div className="text-4xl float-animate" style={{ animationDelay: `${delay}s` }}>
          {icon}
        </div>
      </div>
      <div className={`mt-3 h-1 w-full bg-gradient-to-r ${color} rounded-full opacity-50`} />
    </motion.div>
  );
};

// Recent Report Item
const RecentReportItem = ({ report, index }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const priorityColors = {
    High: 'from-red-500/20 to-red-600/10 border-red-500/20',
    Medium: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20',
    Low: 'from-green-500/20 to-green-600/10 border-green-500/20',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`glass-light p-4 rounded-xl border ${priorityColors[report.priority] || 'border-white/5'} hover:border-indigo-500/30 transition-all duration-300 hover:glow-primary`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-white">{report.title}</p>
          <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
            <span>📍</span> {report.location}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border
            ${report.priority === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              report.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
              'bg-green-500/20 text-green-400 border-green-500/30'}`}>
            {report.priority}
          </span>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
            {report.category}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">🏙️</span>
          </div>
        </div>
        <p className="mt-4 text-gray-400 font-medium">Loading city intelligence...</p>
      </div>
    );
  }

  const statData = [
    { icon: '📋', label: 'Total Reports', value: stats?.total_reports || 0, color: 'from-blue-500 to-indigo-500', delay: 0 },
    { icon: '🚨', label: 'High Priority', value: stats?.high_priority || 0, color: 'from-red-500 to-pink-500', delay: 0.1 },
    { icon: '✅', label: 'Resolved', value: stats?.resolved || 0, color: 'from-green-500 to-emerald-500', delay: 0.2 },
    { icon: '📊', label: 'Categories', value: Object.keys(stats?.categories || {}).length || 0, color: 'from-purple-500 to-violet-500', delay: 0.3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold gradient-text flex items-center gap-3"
        >
          <span className="float-animate">🏙️</span>
          CivicSync AI Dashboard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 mt-2"
        >
          Real-time urban intelligence for smarter, more connected cities
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="glass-card p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          {[
            { to: '/report', label: '📝 Report an Issue', color: 'from-indigo-500 to-purple-500' },
            { to: '/parking', label: '🅿️ Find Parking', color: 'from-green-500 to-emerald-500' },
            { to: '/reports', label: '📋 View All Reports', color: 'from-blue-500 to-cyan-500' },
          ].map(({ to, label, color }) => (
            <Link
              key={to}
              to={to}
              className={`px-6 py-3 rounded-xl bg-gradient-to-r ${color} text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25`}
            >
              {label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Reports */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>🔄</span> Recent Reports
          </h2>
          <Link to="/reports" className="text-sm text-indigo-400 hover:text-indigo-300 transition">
            View all →
          </Link>
        </div>
        {recentReports.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reports submitted yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {recentReports.map((report, index) => (
              <RecentReportItem key={report.id} report={report} index={index} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;