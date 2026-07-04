import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

function ReportForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    user_email: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate fields
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      setError('Please fill in all required fields (Title, Description, Location)');
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
      if (formData.user_email) {
        formDataSubmit.append('user_email', formData.user_email.trim());
      }
      if (image) {
        formDataSubmit.append('image', image);
      }

      console.log('📤 Sending report:', {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        hasImage: !!image
      });

      const response = await axios.post(`${API_BASE}/api/reports`, formDataSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('✅ Report submitted successfully:', response.data);
      setResult(response.data);
      setFormData({ title: '', description: '', location: '', user_email: '' });
      setImage(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('❌ Submit error:', err);
      
      let errorMessage = 'Failed to submit report. ';
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage += 'Cannot connect to backend. Make sure the backend is running on http://localhost:8000';
      } else if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += `Server error (${err.response.status}): `;
        if (err.response.data?.detail) {
          errorMessage += err.response.data.detail;
        } else {
          errorMessage += JSON.stringify(err.response.data);
        }
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage += 'No response from server. Check if backend is running.';
        console.error('Request:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📝 Report a Civic Issue</h1>
      <p className="text-gray-600 mb-8">Help make your city better by reporting problems you encounter.</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Large pothole on Main Street"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the issue in detail..."
              rows="4"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Near City Center, Main Road"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Email (Optional)</label>
            <input
              type="email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach Photo (Optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Submitting...' : '🚀 Submit Report'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">❌ {error}</p>
            {debugInfo && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-red-600">Debug Info</summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800">✅ Report Submitted Successfully!</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">ID:</span> #{result.id}</div>
              <div><span className="font-medium">Category:</span> {result.category}</div>
              <div><span className="font-medium">Priority:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium
                  ${result.priority === 'High' ? 'bg-red-100 text-red-700' :
                    result.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'}`}>
                  {result.priority}
                </span>
              </div>
              <div><span className="font-medium">Department:</span> {result.suggested_department}</div>
              <div className="col-span-2">
                <span className="font-medium">AI Summary:</span> {result.ai_summary || result.summary}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800">💡 How AI Helps</h4>
        <p className="text-sm text-blue-700 mt-1">
          Our AI analyzes your report and automatically assigns the correct category, priority level,
          and suggests the right department. This helps city officials respond faster and more efficiently.
        </p>
      </div>
    </div>
  );
}

export default ReportForm;