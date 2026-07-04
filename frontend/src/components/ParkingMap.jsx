import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = 'http://localhost:8000';

function ParkingMap() {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  useEffect(() => {
    fetchParkingSpots();
  }, []);

  const fetchParkingSpots = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/parking`);
      setParkingSpots(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch parking spots', err);
      setLoading(false);
    }
  };

  const bookSpot = async (spotId) => {
    try {
      setBookingStatus('Booking...');
      await axios.post(`${API_BASE}/api/parking/${spotId}/book`);
      setBookingStatus('✅ Booked successfully!');
      fetchParkingSpots();
      setSelectedSpot(null);
      setTimeout(() => setBookingStatus(null), 3000);
    } catch (err) {
      setBookingStatus('❌ Failed to book');
      console.error(err);
      setTimeout(() => setBookingStatus(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-pulse">
          <div className="text-2xl mb-4">🅿️</div>
          <p className="text-gray-600">Loading parking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🅿️ Smart Parking Finder</h1>
      <p className="text-gray-600 mb-8">
        Real-time parking availability across the city.
      </p>

      {bookingStatus && (
        <div className={`mb-4 p-3 rounded-lg ${
          bookingStatus.includes('✅') 
            ? 'bg-green-100 text-green-700' 
            : bookingStatus.includes('❌')
            ? 'bg-red-100 text-red-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {bookingStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="card h-[500px] overflow-hidden">
            <MapContainer
              center={[12.9716, 79.1589]}
              zoom={14}
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {parkingSpots.map((spot) => (
                <Marker
                  key={spot.id}
                  position={[spot.latitude, spot.longitude]}
                  eventHandlers={{
                    click: () => setSelectedSpot(spot)
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">{spot.location}</p>
                      <p className={spot.is_available ? 'text-green-600' : 'text-red-600'}>
                        {spot.is_available ? '✅ Available' : '❌ Occupied'}
                      </p>
                      {spot.is_available && (
                        <button
                          className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                          onClick={() => bookSpot(spot.id)}
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

        {/* List Section */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Available Spots</h3>
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {parkingSpots.filter(spot => spot.is_available).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No spots available</p>
              ) : (
                parkingSpots.map((spot) => (
                  <div
                    key={spot.id}
                    className={`p-3 rounded-lg border ${
                      spot.is_available 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50 opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{spot.location}</p>
                        <p className="text-sm text-gray-600">
                          {spot.is_available ? '🟢 Available' : '🔴 Occupied'}
                        </p>
                      </div>
                      {spot.is_available && (
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                          onClick={() => bookSpot(spot.id)}
                          disabled={!spot.is_available}
                        >
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Parking Statistics */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold ml-1">{parkingSpots.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Available:</span>
                  <span className="font-semibold ml-1 text-green-600">
                    {parkingSpots.filter(s => s.is_available).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Occupied:</span>
                  <span className="font-semibold ml-1 text-red-600">
                    {parkingSpots.filter(s => !s.is_available).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Utilization:</span>
                  <span className="font-semibold ml-1">
                    {Math.round((parkingSpots.filter(s => !s.is_available).length / parkingSpots.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-4 card bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-800">💡 How It Works</h4>
            <p className="text-sm text-blue-700 mt-1">
              Real-time IoT sensors track parking availability. 
              Click a marker on the map or use the list to find and book available spots.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParkingMap;