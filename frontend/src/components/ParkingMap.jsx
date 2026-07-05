import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom parking icons
const createParkingIcon = (isAvailable) => {
  const color = isAvailable ? '#22c55e' : '#ef4444';
  return L.divIcon({
    className: 'custom-parking-icon',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid rgba(255,255,255,0.3);
        box-shadow: 0 0 30px ${color}40, 0 4px 16px rgba(0,0,0,0.4);
        font-size: 16px;
        color: white;
        font-weight: bold;
        backdrop-filter: blur(4px);
        transition: all 0.3s ease;
      ">
        P
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const API_BASE = 'http://localhost:8000';

function ParkingMap() {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([12.9716, 79.1589]);
  const [mapZoom, setMapZoom] = useState(14);
  const [userLocation, setUserLocation] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const mapRef = useRef(null);

  useEffect(() => {
    fetchParkingSpots();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
        },
        () => console.log('Geolocation not available')
      );
    }
  };

  const fetchParkingSpots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE}/api/parking`, {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      
      let spots = [];
      if (Array.isArray(response.data)) {
        spots = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (response.data.spots && Array.isArray(response.data.spots)) {
          spots = response.data.spots;
        } else {
          const values = Object.values(response.data);
          if (values.length > 0 && values[0] && typeof values[0] === 'object' && 'id' in values[0]) {
            spots = values;
          }
        }
      }
      
      setParkingSpots(spots);
      setLoading(false);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to load parking data');
      setLoading(false);
    }
  };

  const bookSpot = async (spotId) => {
    try {
      setBookingStatus(`⏳ Booking spot ${spotId}...`);
      
      const response = await axios.post(
        `${API_BASE}/api/parking/${spotId}/book`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );
      
      setBookingStatus('✅ Parking spot booked successfully!');
      setTimeout(() => {
        fetchParkingSpots();
      }, 500);
      setTimeout(() => setBookingStatus(null), 3000);
    } catch (err) {
      let errorMessage = '❌ Booking failed. ';
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = '❌ This parking spot is already occupied!';
        } else if (err.response.data && err.response.data.detail) {
          errorMessage = `❌ ${err.response.data.detail}`;
        } else {
          errorMessage = `❌ Server error (${err.response.status})`;
        }
      } else {
        errorMessage = '❌ Could not connect to server.';
      }
      setBookingStatus(errorMessage);
      setTimeout(() => setBookingStatus(null), 4000);
    }
  };

  const filteredSpots = parkingSpots.filter(spot => {
    if (filter === 'available') return spot.is_available === true;
    if (filter === 'occupied') return spot.is_available === false;
    return true;
  }).filter(spot => {
    if (searchTerm === '') return true;
    return spot.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const total = parkingSpots.length;
  const available = parkingSpots.filter(s => s.is_available === true).length;
  const occupied = total - available;
  const utilization = total > 0 ? Math.round((occupied / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">🅿️</span>
          </div>
        </div>
        <p className="mt-4 text-gray-400 font-medium">Loading parking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-white">Error Loading Data</h3>
        <p className="text-gray-400 mt-2">{error}</p>
        <button 
          onClick={fetchParkingSpots}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:scale-105 transition"
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">🅿️ Smart Parking Finder</h1>
          <p className="text-gray-400 mt-1">Real-time parking availability across the city</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={getUserLocation}
            className="px-4 py-2 glass-light rounded-xl text-sm text-white hover:glow-primary transition"
          >
            📍 My Location
          </button>
          <button
            onClick={fetchParkingSpots}
            className="px-4 py-2 glass-light rounded-xl text-sm text-white hover:glow-primary transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {bookingStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl glass ${
            bookingStatus.includes('✅') ? 'border-green-500/30' :
            bookingStatus.includes('❌') ? 'border-red-500/30' :
            'border-yellow-500/30'
          }`}
        >
          {bookingStatus}
        </motion.div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spots', value: total, color: 'from-blue-500 to-indigo-500' },
          { label: 'Available', value: available, color: 'from-green-500 to-emerald-500' },
          { label: 'Occupied', value: occupied, color: 'from-red-500 to-pink-500' },
          { label: 'Utilization', value: `${utilization}%`, color: 'from-purple-500 to-violet-500' },
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

      {/* Map Section */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="glass-card p-1 overflow-hidden rounded-2xl"
        style={{ position: 'relative', zIndex: 0 }}
      >
        <div className="h-[400px] w-full rounded-xl overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            ref={mapRef}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {userLocation && (
              <CircleMarker
                center={userLocation}
                radius={10}
                fillColor="#818cf8"
                color="#6366f1"
                weight={3}
                fillOpacity={0.6}
              >
                <Popup>📍 You are here</Popup>
              </CircleMarker>
            )}

            {parkingSpots.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.latitude, spot.longitude]}
                icon={createParkingIcon(spot.is_available)}
                eventHandlers={{
                  click: () => {
                    if (spot.is_available) {
                      bookSpot(spot.id);
                    }
                  }
                }}
              >
                <Popup>
                  <div className="text-center py-2">
                    <h3 className="font-semibold text-white">{spot.location}</h3>
                    <p className={spot.is_available ? 'text-green-400' : 'text-red-400'}>
                      {spot.is_available ? '✅ Available' : '❌ Occupied'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Filter:</span>
          {[
            { key: 'all', label: `All (${total})` },
            { key: 'available', label: `Available (${available})` },
            { key: 'occupied', label: `Occupied (${occupied})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                filter === key 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                  : 'text-gray-400 hover:text-white glass-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Search parking locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 glass-light rounded-xl text-white placeholder-gray-500 border border-white/5 focus:border-indigo-500/30 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Parking Spots Grid */}
      {filteredSpots.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-400">No parking spots match your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpots.map((spot, index) => (
            <motion.div
              key={spot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-card p-4 cursor-hover ${
                spot.is_available 
                  ? 'hover:border-green-500/30 hover:glow-primary' 
                  : 'opacity-60 hover:border-red-500/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-white">{spot.location}</h3>
                <span className={`text-2xl ${spot.is_available ? 'text-green-400' : 'text-red-400'}`}>
                  {spot.is_available ? '🟢' : '🔴'}
                </span>
              </div>
              <p className={`text-sm font-medium mt-1 ${spot.is_available ? 'text-green-400' : 'text-red-400'}`}>
                {spot.is_available ? 'Available' : 'Occupied'}
              </p>
              {spot.is_available && (
                <button
                  onClick={() => bookSpot(spot.id)}
                  className="mt-3 w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:scale-105 transition"
                  disabled={bookingStatus && bookingStatus.includes('⏳')}
                >
                  {bookingStatus && bookingStatus.includes('⏳') ? 'Booking...' : 'Book Now'}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default ParkingMap;