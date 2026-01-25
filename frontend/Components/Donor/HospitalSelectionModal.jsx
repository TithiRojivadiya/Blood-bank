import { useState, useEffect } from "react";
import { API_URL } from "../../src/lib/env";

const HospitalSelectionModal = ({ isOpen, onClose, onSelect, currentLocation, onGetLocation }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState("my_location");
  const [manualCity, setManualCity] = useState("");
  const [myLocation, setMyLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (isOpen && currentLocation) {
      setMyLocation(currentLocation);
      fetchHospitals(currentLocation.lat, currentLocation.lng);
    }
  }, [isOpen, currentLocation]);

  const getMyLocation = () => {
    setLocationError("");
    setLoading(true);
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        setLocationError("");
        fetchHospitals(loc.lat, loc.lng);
        setLoading(false);
      },
      () => {
        setLocationError("Could not get location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchHospitals = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/hospitals/near?lat=${lat}&lng=${lng}&max_distance=50000`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setHospitals(Array.isArray(data) ? data : []);
    } catch (err) {
      setLocationError(err.message || "Failed to find hospitals");
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (hospital) => {
    onSelect(hospital);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">Select Hospital</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="locationMode"
                  checked={locationMode === "my_location"}
                  onChange={() => {
                    setLocationMode("my_location");
                    setLocationError("");
                  }}
                />
                <span>Use my location</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="locationMode"
                  checked={locationMode === "manual"}
                  onChange={() => {
                    setLocationMode("manual");
                    setMyLocation(null);
                    setHospitals([]);
                  }}
                />
                <span>Enter city</span>
              </label>
            </div>

            {locationMode === "my_location" && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={getMyLocation}
                  disabled={loading}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50"
                >
                  {loading ? "Getting…" : "📍 Get my location"}
                </button>
                {myLocation && (
                  <span className="ml-3 text-sm text-gray-600">
                    {myLocation.lat.toFixed(5)}, {myLocation.lng.toFixed(5)}
                  </span>
                )}
                {locationError && <p className="text-sm text-red-600 mt-1">{locationError}</p>}
              </div>
            )}

            {locationMode === "manual" && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Enter city name"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualCity.trim()) {
                      fetch(`${API_URL}/api/hospitals`)
                        .then((r) => r.json())
                        .then((data) => {
                          const filtered = Array.isArray(data)
                            ? data.filter((h) => h.city && h.city.toLowerCase().includes(manualCity.toLowerCase()))
                            : [];
                          setHospitals(filtered);
                        })
                        .catch(() => setHospitals([]));
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Search
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            </div>
          )}

          {!loading && hospitals.length === 0 && (
            <p className="text-gray-500 text-center py-8">No hospitals found. Try a different location or city.</p>
          )}

          {!loading && hospitals.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  onClick={() => handleSelect(h)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{h.name}</h4>
                      <p className="text-sm text-gray-600">{h.city}</p>
                      {h.distance_meters != null && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(h.distance_meters / 1000).toFixed(2)} km away
                        </p>
                      )}
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalSelectionModal;
