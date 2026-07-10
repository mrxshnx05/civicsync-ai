import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function ReportForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    user_email: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [submissionCount, setSubmissionCount] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setCharacterCount(formData.description.length);
    const count = localStorage.getItem('reportCount') || 0;
    setSubmissionCount(parseInt(count));
  }, [formData.description]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG, GIF, or WEBP)');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    else if (formData.title.length < 3) errors.title = 'Title must be at least 3 characters';
    if (!formData.description.trim()) errors.description = 'Description is required';
    else if (formData.description.length < 10) errors.description = 'Description must be at least 10 characters';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (formData.user_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user_email)) {
      errors.user_email = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please fix the errors before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setDebugInfo(null);

    try {
      const formDataSubmit = new FormData();
      formDataSubmit.append('title', formData.title.trim());
      formDataSubmit.append('description', formData.description.trim());
      formDataSubmit.append('location', formData.location.trim());
      if (formData.user_email) formDataSubmit.append('user_email', formData.user_email.trim());
      if (image) formDataSubmit.append('image', image);

      const response = await axios.post(`${API_BASE}/api/reports`, formDataSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      const newCount = submissionCount + 1;
      setSubmissionCount(newCount);
      localStorage.setItem('reportCount', newCount.toString());

      setResult(response.data);
      setFormData({ title: '', description: '', location: '', user_email: '' });
      setImage(null);
      setImagePreview(null);
      setCharacterCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('❌ Submit error:', err);
      let errorMessage = 'Failed to submit report. ';
      if (err.code === 'ERR_NETWORK') {
        errorMessage += 'Cannot connect to backend. Make sure the backend is running on http://localhost:8000';
      } else if (err.response) {
        errorMessage += `Server error (${err.response.status}): ${err.response.data?.detail || JSON.stringify(err.response.data)}`;
      } else if (err.request) {
        errorMessage += 'No response from server. Check if backend is running.';
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
      setDebugInfo({
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      High: 'bg-red-500/20 text-red-400 border-red-500/30',
      Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Low: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return styles[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Pothole': '🕳️', 'Garbage_Overflow': '🗑️', 'Streetlight_Outage': '💡',
      'Water_Leakage': '💧', 'Traffic_Signal_Issue': '🚦', 'Tree_Fall': '🌳',
      'Drainage_Blockage': '🌊', 'Other': '📌'
    };
    return emojis[category] || '📌';
  };

  const getPersonalizedMessage = (result) => {
    const userName = formData.user_email ? formData.user_email.split('@')[0] : 'Citizen';
    const category = result.category || 'issue';
    const priority = result.priority || 'Medium';
    const messages = {
      'High': `🚨 ${userName}, this is a HIGH PRIORITY ${category.toLowerCase()}! We've alerted the ${result.suggested_department} department. They'll respond within ${result.estimated_resolution_hours} hours.`,
      'Medium': `📋 ${userName}, we've received your ${category.toLowerCase()} report. The ${result.suggested_department} department will address it within ${result.estimated_resolution_hours} hours.`,
      'Low': `📌 Thanks ${userName}! Your ${category.toLowerCase()} report has been logged. The ${result.suggested_department} department will review it within ${result.estimated_resolution_hours} hours.`
    };
    return messages[priority] || messages['Medium'];
  };

  const getMotivationalMessage = () => {
    const messages = [
      "🌟 Your voice matters! Together we're building a better city.",
      "💪 Every report makes a difference. Thank you for being an active citizen!",
      "🏙️ You're helping shape the future of our urban community.",
      "🌱 Small actions lead to big changes. Keep reporting!",
      "🤝 Your civic engagement inspires others to participate."
    ];
    return messages[submissionCount % messages.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold gradient-text"
        >
          📝 Report a Civic Issue
        </motion.h1>
        <p className="text-gray-400 mt-2">
          Help make your city better by reporting problems you encounter. 
          Our AI will automatically classify and prioritize your report.
        </p>
        {submissionCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-green-400 mt-2"
          >
            🌟 You've submitted {submissionCount} report{submissionCount > 1 ? 's' : ''} so far!
          </motion.p>
        )}
      </div>

      {/* Success Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 border-green-500/30 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl animate-float">🎉</span>
            <div>
              <h3 className="text-xl font-bold text-green-400">Report Submitted Successfully!</h3>
              <p className="text-sm text-green-300/70">{getPersonalizedMessage(result)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 glass p-4 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">🆔 ID:</span>
              <span className="font-mono text-indigo-400">#{result.id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">📂 Category:</span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                {getCategoryEmoji(result.category)} {result.category || 'Not classified'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">⚡ Priority:</span>
              <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityBadge(result.priority)}`}>
                {result.priority || 'Not assigned'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">🏛️ Department:</span>
              <span className="text-white font-medium">{result.suggested_department || 'Not assigned'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">📊 Confidence:</span>
              <span className="text-white">{(result.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">⏱️ Resolution:</span>
              <span className="text-white">{result.estimated_resolution_hours || 48} hours</span>
            </div>
            <div className="col-span-1 md:col-span-2 mt-2 pt-3 border-t border-white/5">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 min-w-[80px] text-sm">🤖 AI Summary:</span>
                <div className="flex-1">
                  <p className="text-gray-300 bg-white/5 p-3 rounded-lg text-sm leading-relaxed">
                    {result.ai_summary || result.summary || 'No summary available'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">💡 {getMotivationalMessage()}</p>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setResult(null)}
            className="mt-4 text-sm text-green-400 hover:text-green-300 transition"
          >
            📝 Submit another report →
          </button>
        </motion.div>
      )}

      {/* Form */}
      {!result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Issue Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 glass-light rounded-xl text-white placeholder-gray-500 border ${
                  formErrors.title ? 'border-red-500/50' : 'border-white/5'
                } focus:border-indigo-500/50 focus:outline-none transition`}
                placeholder="e.g., Large pothole on Main Street"
                maxLength="200"
                disabled={loading}
              />
              {formErrors.title && <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>}
              <p className="mt-1 text-xs text-gray-500">{formData.title.length}/200 characters</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 glass-light rounded-xl text-white placeholder-gray-500 border ${
                  formErrors.description ? 'border-red-500/50' : 'border-white/5'
                } focus:border-indigo-500/50 focus:outline-none transition`}
                placeholder="Describe the issue in detail (minimum 10 characters)..."
                rows="5"
                maxLength="2000"
                disabled={loading}
              />
              {formErrors.description && <p className="mt-1 text-sm text-red-400">{formErrors.description}</p>}
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">{characterCount}/2000 characters</p>
                {characterCount > 0 && characterCount < 10 && (
                  <p className="text-xs text-yellow-400">⚠️ Minimum 10 characters</p>
                )}
                {characterCount >= 10 && <p className="text-xs text-green-400">✅ Good description</p>}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 glass-light rounded-xl text-white placeholder-gray-500 border ${
                  formErrors.location ? 'border-red-500/50' : 'border-white/5'
                } focus:border-indigo-500/50 focus:outline-none transition`}
                placeholder="e.g., Near City Center, Main Road"
                disabled={loading}
              />
              {formErrors.location && <p className="mt-1 text-sm text-red-400">{formErrors.location}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Your Email <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="email"
                name="user_email"
                value={formData.user_email}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 glass-light rounded-xl text-white placeholder-gray-500 border ${
                  formErrors.user_email ? 'border-red-500/50' : 'border-white/5'
                } focus:border-indigo-500/50 focus:outline-none transition`}
                placeholder="email@example.com"
                disabled={loading}
              />
              {formErrors.user_email && <p className="mt-1 text-sm text-red-400">{formErrors.user_email}</p>}
              <p className="mt-1 text-xs text-gray-500">We'll send you updates on your report status</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Attach Photo <span className="text-gray-500 text-xs">(Optional - Max 5MB)</span>
              </label>
              <div className="flex items-center gap-4 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 transition"
                  disabled={loading}
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-red-400 hover:text-red-300 text-sm transition"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-white/5" />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                '🚀 Submit Report'
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 glass border-red-500/30 rounded-xl text-red-400">
              <p className="font-semibold">❌ {error}</p>
              {debugInfo && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-red-400/70">Debug Info</summary>
                  <pre className="mt-2 p-2 bg-black/30 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 glass-card p-6"
      >
        <h4 className="font-semibold text-indigo-400 flex items-center gap-2">💡 How AI Helps</h4>
        <ul className="mt-2 text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>Automatically categorizes your issue (Pothole, Garbage, Water Leakage, etc.)</li>
          <li>Assigns priority level (High/Medium/Low) based on urgency</li>
          <li>Suggests the right department for faster response</li>
          <li>Provides AI-powered summary and recommendations</li>
          <li>Estimates resolution time for better transparency</li>
        </ul>
        <div className="mt-3 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <p className="text-sm text-indigo-300 font-medium">🌟 Personalized Experience:</p>
          <p className="text-xs text-indigo-300/70 mt-1">
            Each report gets a personalized response based on your input. 
            We track your contributions and celebrate your civic engagement!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ReportForm;