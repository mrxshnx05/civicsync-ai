import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import ParkingMap from './components/ParkingMap';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <Link to="/" className="text-2xl font-bold flex items-center gap-2">
                🏙️ CivicSync AI
              </Link>
              <div className="hidden md:flex space-x-6">
                <NavLink to="/" className={({isActive}) => 
                  isActive ? 'border-b-2 border-white pb-1' : 'hover:text-gray-300'
                }>Dashboard</NavLink>
                <NavLink to="/report" className={({isActive}) => 
                  isActive ? 'border-b-2 border-white pb-1' : 'hover:text-gray-300'
                }>Report Issue</NavLink>
                <NavLink to="/reports" className={({isActive}) => 
                  isActive ? 'border-b-2 border-white pb-1' : 'hover:text-gray-300'
                }>All Reports</NavLink>
                <NavLink to="/parking" className={({isActive}) => 
                  isActive ? 'border-b-2 border-white pb-1' : 'hover:text-gray-300'
                }>Parking</NavLink>
              </div>
              <div className="md:hidden">
                {/* Mobile menu button - implement if needed */}
                <button className="text-white">☰</button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/reports" element={<ReportList />} />
            <Route path="/parking" element={<ParkingMap />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-16 py-6">
          <div className="container mx-auto px-4 text-center">
            <p>© 2026 CivicSync AI - Built for #INCLUDE 1.0 Hackathon</p>
            <p className="text-gray-400 text-sm mt-1">Powered by AWS & OpenRouter</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;