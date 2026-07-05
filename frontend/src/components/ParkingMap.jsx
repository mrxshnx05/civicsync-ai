import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 14px;
        color: white;
        font-weight: bold;
      ">
        P
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const API_BASE = 'http://localhost:8000';

function ParkingMap() {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [mapCenter, setMapCenter] = useState([12.9716, 79.1589]);
  const [mapZoom, setMapZoom] = useState(14);
  const [userLocation, setUserLocation] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
      setShowBookModal(false);
      setSelectedSpot(null);
      
      setTimeout(() => {
        fetchParkingSpots();
      }, 500);
      
      setTimeout(() => {
        setBookingStatus(null);
      }, 3000);
      
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading parking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3 text-red-700">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold">Error Loading Data</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchParkingSpots}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">🅿️ Smart Parking Finder</h1>
          <p className="text-gray-600">Real-time parking availability across the city</p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <button
            onClick={getUserLocation}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            📍 My Location
          </button>
          <button
            onClick={fetchParkingSpots}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {bookingStatus && (
        <div className={`mb-4 p-4 rounded-lg ${
          bookingStatus.includes('✅') 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : bookingStatus.includes('❌') 
            ? 'bg-red-100 border border-red-300 text-red-800'
            : 'bg-yellow-100 border border-yellow-300 text-yellow-800'
        }`}>
          {bookingStatus}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Total Spots</p>
          <p className="text-2xl font-bold text-blue-700">{total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-700">{available}</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Occupied</p>
          <p className="text-2xl font-bold text-red-700">{occupied}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Utilization</p>
          <p className="text-2xl font-bold text-purple-700">{utilization}%</p>
        </div>
      </div>

      {/* ✅ FIX: Map Section with proper z-index */}
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden mb-6"
        style={{ position: 'relative', zIndex: 0 }}  // ✅ Lower z-index for map container
      >
        <div className="h-[400px] w-full">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%', zIndex: 0 }}  // ✅ Map z-index
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
                radius={8}
                fillColor="#3b82f6"
                color="#1d4ed8"
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
                    setSelectedSpot(spot);
                    setShowBookModal(true);
                  }
                }}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold">{spot.location}</h3>
                    <p className={spot.is_available ? 'text-green-600' : 'text-red-600'}>
                      {spot.is_available ? '✅ Available' : '❌ Occupied'}
                    </p>
                    {spot.is_available && (
                      <button
                        onClick={() => bookSpot(spot.id)}
                        className="mt-2 px-4 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              filter === 'available' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Available ({available})
          </button>
          <button
            onClick={() => setFilter('occupied')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              filter === 'occupied' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Occupied ({occupied})
          </button>
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search parking locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Parking Spots Grid */}
      {filteredSpots.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
          <p className="text-gray-600">No parking spots match your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpots.map((spot) => (
            <div
              key={spot.id}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
                spot.is_available 
                  ? 'border-green-300 bg-green-50 hover:border-green-500' 
                  : 'border-red-300 bg-red-50 opacity-75'
              }`}
              onClick={() => {
                setSelectedSpot(spot);
                setShowBookModal(true);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{spot.location}</h3>
                <span className={`text-2xl ${spot.is_available ? 'text-green-500' : 'text-red-500'}`}>
                  {spot.is_available ? '🟢' : '🔴'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${spot.is_available ? 'text-green-700' : 'text-red-700'}`}>
                    {spot.is_available ? 'Available' : 'Occupied'}
                  </span>
                </div>
                {spot.latitude && spot.longitude && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-mono text-xs">
                      {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {spot.is_available && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    bookSpot(spot.id);
                  }}
                  className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={bookingStatus && bookingStatus.includes('⏳')}
                >
                  {bookingStatus && bookingStatus.includes('⏳') ? 'Booking...' : 'Book Now'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* How It Works */}
      <div className="mt-8 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 How It Works</h4>
        <p className="text-sm text-blue-700">
          Real-time IoT sensors track parking availability. Click <strong>"Book Now"</strong> on any available spot to reserve it.
          The system will automatically update the status.
        </p>
      </div>
    </div>
  );
}

export default ParkingMap;