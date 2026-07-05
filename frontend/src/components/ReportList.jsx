import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

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

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching reports from:', `${API_BASE}/api/reports`);
      
      const response = await axios.get(`${API_BASE}/api/reports`, {
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      });
      
      console.log('✅ Reports response:', response.data);
      
      let reportsData = [];
      if (Array.isArray(response.data)) {
        reportsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        reportsData = Object.values(response.data).filter(item => 
          item && typeof item === 'object' && 'id' in item
        );
      }
      
      console.log('📊 Processed reports:', reportsData.length);
      setReports(reportsData);
      applyFilters(reportsData, searchTerm, filterPriority, filterStatus, sortBy);
      
      // Fetch stats
      try {
        const statsResponse = await axios.get(`${API_BASE}/api/stats`);
        setStats(statsResponse.data);
      } catch (statsErr) {
        console.warn('Stats fetch failed:', statsErr);
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('❌ Fetch error:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to load reports: ${err.message}`);
      setLoading(false);
    }
  };

  // Apply filters and sorting
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
      default:
        break;
    }
    
    setFilteredReports(filtered);
  };

  // Initial fetch
  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters(reports, searchTerm, filterPriority, filterStatus, sortBy);
  }, [reports, searchTerm, filterPriority, filterStatus, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
    setIsRefreshing(false);
  };

  const handleReportClick = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      High: 'bg-red-500/20 text-red-700 border-red-300',
      Medium: 'bg-yellow-500/20 text-yellow-700 border-yellow-300',
      Low: 'bg-green-500/20 text-green-700 border-green-300'
    };
    return styles[priority] || 'bg-gray-500/20 text-gray-700 border-gray-300';
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Open': 'bg-blue-500/20 text-blue-700 border-blue-300',
      'In Progress': 'bg-yellow-500/20 text-yellow-700 border-yellow-300',
      'Resolved': 'bg-green-500/20 text-green-700 border-green-300',
      'Closed': 'bg-gray-500/20 text-gray-700 border-gray-300'
    };
    return styles[status] || 'bg-gray-500/20 text-gray-700 border-gray-300';
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Pothole': '🕳️',
      'Garbage_Overflow': '🗑️',
      'Streetlight_Outage': '💡',
      'Water_Leakage': '💧',
      'Traffic_Signal_Issue': '🚦',
      'Tree_Fall': '🌳',
      'Drainage_Blockage': '🌊',
      'Other': '📌'
    };
    return emojis[category] || '📌';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && reports.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading reports...</p>
          <p className="text-sm text-gray-400">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-8 text-center shadow-xl">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-800">Oops! Something went wrong</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition transform hover:scale-105"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="text-4xl">📋</span>
                All Reports
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
                </span>
              </h1>
              <p className="text-white/80 mt-1">
                Track and monitor civic issues across the city
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-sm disabled:opacity-50 flex items-center gap-2"
              >
                <span className={`transition-transform duration-500 ${isRefreshing ? 'rotate-180' : ''}`}>
                  🔄
                </span>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <p className="text-sm text-blue-600 font-medium">Total Reports</p>
            <p className="text-2xl font-bold text-blue-800">{stats.total_reports || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <p className="text-sm text-red-600 font-medium">High Priority</p>
            <p className="text-2xl font-bold text-red-800">{stats.high_priority || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <p className="text-sm text-green-600 font-medium">Resolved</p>
            <p className="text-2xl font-bold text-green-800">{stats.resolved || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <p className="text-sm text-purple-600 font-medium">Open</p>
            <p className="text-2xl font-bold text-purple-800">{stats.open_reports || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search reports by title, location, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              <option value="newest">📅 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
              <option value="priority">⚡ By Priority</option>
              <option value="category">📂 By Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-12 text-center shadow-xl">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-700">No Reports Found</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm || filterPriority !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your filters to see more results'
              : 'Be the first to report an issue and help improve your city!'}
          </p>
          {(searchTerm || filterPriority !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPriority('all');
                setFilterStatus('all');
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report, index) => (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              style={{ 
                animation: `fadeInUp 0.6s ease-out ${index * 0.05}s forwards`,
                opacity: 0,
                transform: 'translateY(30px)'
              }}
              onClick={() => handleReportClick(report)}
            >
              <div className="relative">
                <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg ${
                  report.priority === 'High' ? 'bg-red-500' :
                  report.priority === 'Medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  {report.priority || 'Medium'}
                </div>
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryEmoji(report.category)}</span>
                      <h3 className="font-semibold text-gray-800 line-clamp-1">{report.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {report.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span>📍 {report.location}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(report.priority)}`}>
                      ⚡ {report.priority || 'Medium'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(report.status)}`}>
                      {report.status || 'Open'}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {report.category || 'Other'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <span>🆔 #{report.id}</span>
                    <span>📅 {formatDate(report.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {showModal && selectedReport && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {getCategoryEmoji(selectedReport.category)} Report Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-2xl transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedReport.title}
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityBadge(selectedReport.priority)}`}>
                  ⚡ {selectedReport.priority || 'Medium'} Priority
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedReport.status)}`}>
                  {selectedReport.status || 'Open'}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {selectedReport.category || 'Other'}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-600 min-w-[80px]">📍 Location:</span>
                  <span className="text-gray-800">{selectedReport.location}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-600 min-w-[80px]">🏛️ Department:</span>
                  <span className="text-gray-800">{selectedReport.suggested_department || 'Not assigned'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-600 min-w-[80px]">📊 Confidence:</span>
                  <span className="text-gray-800">{(selectedReport.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-600 min-w-[80px]">⏱️ Resolution:</span>
                  <span className="text-gray-800">{selectedReport.estimated_resolution_hours || 48} hours</span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">🤖 AI Summary</h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {selectedReport.ai_summary || selectedReport.summary || 'No summary available'}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-2">📝 Full Description</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400">
                <span>🆔 Report ID: {selectedReport.id}</span>
                <span>📅 Created: {formatDate(selectedReport.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportList;