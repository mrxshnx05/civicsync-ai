import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function ReportList() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE}/api/reports`, {
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      });
      
      let reportsData = [];
      if (Array.isArray(response.data)) {
        reportsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        reportsData = Object.values(response.data).filter(item => 
          item && typeof item === 'object' && 'id' in item
        );
      }
      
      setReports(reportsData);
      applyFilters(reportsData, searchTerm, filterPriority, filterStatus, sortBy);
      
      try {
        const statsResponse = await axios.get(`${API_BASE}/api/stats`);
        setStats(statsResponse.data);
      } catch (statsErr) {
        console.warn('Stats fetch failed:', statsErr);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(`Failed to load reports: ${err.message}`);
      setLoading(false);
    }
  };

  const applyFilters = (data, search, priority, status, sort) => {
    let filtered = [...data];
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(report =>
        (report.title?.toLowerCase() || '').includes(lowerSearch) ||
        (report.description?.toLowerCase() || '').includes(lowerSearch) ||
        (report.location?.toLowerCase() || '').includes(lowerSearch) ||
        (report.category?.toLowerCase() || '').includes(lowerSearch)
      );
    }
    
    if (priority !== 'all') {
      filtered = filtered.filter(report => report.priority === priority);
    }
    
    if (status !== 'all') {
      filtered = filtered.filter(report => report.status === status);
    }
    
    switch(sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'priority':
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        filtered.sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1));
        break;
      case 'category':
        filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      default: break;
    }
    
    setFilteredReports(filtered);
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => fetchReports(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters(reports, searchTerm, filterPriority, filterStatus, sortBy);
  }, [reports, searchTerm, filterPriority, filterStatus, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
    setIsRefreshing(false);
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      High: 'bg-red-500/20 text-red-400 border-red-500/30',
      Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Low: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return styles[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Open': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Closed': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Pothole': '🕳️', 'Garbage_Overflow': '🗑️', 'Streetlight_Outage': '💡',
      'Water_Leakage': '💧', 'Traffic_Signal_Issue': '🚦', 'Tree_Fall': '🌳',
      'Drainage_Blockage': '🌊', 'Other': '📌'
    };
    return emojis[category] || '📌';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">📋</span>
          </div>
        </div>
        <p className="mt-4 text-gray-400 font-medium">Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-white">Oops! Something went wrong</h3>
        <p className="text-gray-400 mt-2">{error}</p>
        <button onClick={handleRefresh} className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:scale-105 transition">
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      {/* Header */}
      <div className="glass-card p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
              📋 All Reports
              <span className="text-sm bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full">
                {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
              </span>
            </h1>
            <p className="text-gray-400 mt-1">Track and monitor civic issues across the city</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 glass-light rounded-xl text-sm text-white hover:glow-primary transition disabled:opacity-50"
          >
            <span className={`transition-transform duration-500 ${isRefreshing ? 'rotate-180' : ''}`}>🔄</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Reports', value: stats.total_reports || 0, color: 'from-blue-500 to-indigo-500' },
            { label: 'High Priority', value: stats.high_priority || 0, color: 'from-red-500 to-pink-500' },
            { label: 'Resolved', value: stats.resolved || 0, color: 'from-green-500 to-emerald-500' },
            { label: 'Open', value: stats.open_reports || 0, color: 'from-purple-500 to-violet-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4 text-center"
            >
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search reports by title, location, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 glass-light rounded-xl text-white placeholder-gray-500 border border-white/5 focus:border-indigo-500/30 focus:outline-none transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 glass-light rounded-xl text-white border border-white/5 focus:border-indigo-500/30 focus:outline-none transition bg-transparent"
            >
              <option value="all" className="bg-gray-900">All Priorities</option>
              <option value="High" className="bg-gray-900">🔴 High</option>
              <option value="Medium" className="bg-gray-900">🟡 Medium</option>
              <option value="Low" className="bg-gray-900">🟢 Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 glass-light rounded-xl text-white border border-white/5 focus:border-indigo-500/30 focus:outline-none transition bg-transparent"
            >
              <option value="all" className="bg-gray-900">All Status</option>
              <option value="Open" className="bg-gray-900">Open</option>
              <option value="In Progress" className="bg-gray-900">In Progress</option>
              <option value="Resolved" className="bg-gray-900">Resolved</option>
              <option value="Closed" className="bg-gray-900">Closed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 glass-light rounded-xl text-white border border-white/5 focus:border-indigo-500/30 focus:outline-none transition bg-transparent"
            >
              <option value="newest" className="bg-gray-900">📅 Newest</option>
              <option value="oldest" className="bg-gray-900">📅 Oldest</option>
              <option value="priority" className="bg-gray-900">⚡ Priority</option>
              <option value="category" className="bg-gray-900">📂 Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-white">No Reports Found</h3>
          <p className="text-gray-400 mt-2">
            {searchTerm || filterPriority !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your filters to see more results'
              : 'Be the first to report an issue and help improve your city!'}
          </p>
          {(searchTerm || filterPriority !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterPriority('all'); setFilterStatus('all'); }}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:scale-105 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report, index) => (
            <ReportCard
              key={report.id}
              report={report}
              index={index}
              onClick={() => setSelectedReport(report)}
              getPriorityBadge={getPriorityBadge}
              getStatusBadge={getStatusBadge}
              getCategoryEmoji={getCategoryEmoji}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      <AnimatePresence>
        {showModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal content - same as before but styled with glass */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold gradient-text">
                  {getCategoryEmoji(selectedReport.category)} Report Details
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl transition">
                  ✕
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{selectedReport.title}</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm border ${getPriorityBadge(selectedReport.priority)}`}>
                  ⚡ {selectedReport.priority || 'Medium'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusBadge(selectedReport.status)}`}>
                  {selectedReport.status || 'Open'}
                </span>
                <span className="px-3 py-1 bg-white/5 text-gray-300 rounded-full text-sm">
                  {selectedReport.category || 'Other'}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 min-w-[80px]">📍 Location:</span>
                  <span className="text-white">{selectedReport.location}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 min-w-[80px]">🏛️ Department:</span>
                  <span className="text-white">{selectedReport.suggested_department || 'Not assigned'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 min-w-[80px]">📊 Confidence:</span>
                  <span className="text-white">{(selectedReport.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 min-w-[80px]">⏱️ Resolution:</span>
                  <span className="text-white">{selectedReport.estimated_resolution_hours || 48} hours</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-indigo-400 mb-2">🤖 AI Summary</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedReport.ai_summary || selectedReport.summary || 'No summary available'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold text-gray-400 mb-2">📝 Full Description</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{selectedReport.description}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-gray-500">
                <span>🆔 {selectedReport.id}</span>
                <span>📅 {formatDate(selectedReport.created_at)}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Report Card Component
const ReportCard = ({ report, index, onClick, getPriorityBadge, getStatusBadge, getCategoryEmoji, formatDate }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="glass-card p-5 cursor-hover"
      onClick={onClick}
    >
      <div className="relative">
        <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(report.priority)}`}>
          {report.priority || 'Medium'}
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{getCategoryEmoji(report.category)}</span>
          <h3 className="font-semibold text-white line-clamp-1">{report.title}</h3>
        </div>
        
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{report.description}</p>
        
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span>📍 {report.location}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(report.status)}`}>
            {report.status || 'Open'}
          </span>
          <span className="px-2 py-0.5 bg-white/5 text-gray-400 rounded-full text-xs">
            {report.category || 'Other'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-3">
          <span>🆔 #{report.id}</span>
          <span>📅 {formatDate(report.created_at)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportList;