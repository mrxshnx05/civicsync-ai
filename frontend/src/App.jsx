import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import ParkingMap from './components/ParkingMap';
import './App.css';

// Custom Cursor Component
const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updatePosition = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const updateHover = (e) => {
      const target = e.target.closest('a, button, [role="button"], .cursor-hover');
      setIsHovering(!!target);
    };

    document.addEventListener('mousemove', updatePosition);
    document.addEventListener('mouseover', updateHover);

    return () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mouseover', updateHover);
    };
  }, []);

  return (
    <>
      <div 
        className={`custom-cursor ${isHovering ? 'hover' : ''}`}
        style={{ left: position.x - 10, top: position.y - 10 }}
      />
      <div 
        className="custom-cursor-dot"
        style={{ left: position.x - 2, top: position.y - 2 }}
      />
    </>
  );
};

// Animated Background
const AnimatedBackground = () => (
  <div className="animated-bg">
    <div className="orb" />
    <div className="orb" style={{ animationDelay: '-5s' }} />
    <div className="orb" style={{ animationDelay: '-10s' }} />
    <div className="grid-line horizontal" style={{ top: '25%' }} />
    <div className="grid-line horizontal" style={{ top: '50%' }} />
    <div className="grid-line horizontal" style={{ top: '75%' }} />
    <div className="grid-line vertical" style={{ left: '25%' }} />
    <div className="grid-line vertical" style={{ left: '50%' }} />
    <div className="grid-line vertical" style={{ left: '75%' }} />
  </div>
);

function App() {
  return (
    <Router>
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <CustomCursor />
        
        {/* Glass Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass py-4 px-6 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold gradient-text flex items-center gap-2">
              <span className="text-3xl">🏙️</span>
              CivicSync AI
            </Link>
            <div className="hidden md:flex space-x-8">
              {[
                { to: '/', label: 'Dashboard', icon: '📊' },
                { to: '/report', label: 'Report', icon: '📝' },
                { to: '/reports', label: 'Reports', icon: '📋' },
                { to: '/parking', label: 'Parking', icon: '🅿️' },
              ].map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `
                    text-sm font-medium transition-all duration-300 relative
                    ${isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}
                    group
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{icon}</span>
                    {label}
                  </span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
                </NavLink>
              ))}
            </div>
            <div className="md:hidden">
              {/* Mobile menu button - can be enhanced */}
              <button className="text-gray-400 hover:text-white">☰</button>
            </div>
          </div>
        </nav>

        {/* Main Content with padding for fixed nav */}
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/report" element={<ReportForm />} />
              <Route path="/reports" element={<ReportList />} />
              <Route path="/parking" element={<ParkingMap />} />
            </Routes>
          </div>
        </div>

        {/* Glass Footer */}
        <footer className="glass border-t border-white/5 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">
              © 2026 CivicSync AI - Built for #INCLUDE 1.0 Hackathon
            </p>
            <p className="text-gray-500 text-xs mt-1 flex items-center justify-center gap-4">
              <span>⚡ Powered by AWS &amp; OpenRouter</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;