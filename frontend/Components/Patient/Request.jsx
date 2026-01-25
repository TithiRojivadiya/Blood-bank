import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";

const Request = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    bloodGroup: "",
    component: "",
    unitsRequired: "",
    urgency: "",
    requiredBy: "",
    city: "",
    contactNumber: "",
    reason: "",
  });
  const [locationMode, setLocationMode] = useState("manual"); // 'my_location' | 'manual'
  const [myLocation, setMyLocation] = useState(null); // { lat, lng } | null
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Fetch suggestions when relevant fields change
    if (['bloodGroup', 'component', 'unitsRequired', 'city'].includes(e.target.name)) {
      fetchSuggestions();
    }
  };

  const fetchSuggestions = async () => {
    if (!formData.bloodGroup || !formData.component || !formData.unitsRequired || (!formData.city && !myLocation)) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const params = new URLSearchParams({
        blood_group: formData.bloodGroup,
        component: formData.component,
        units_required: formData.unitsRequired,
      });
      
      if (myLocation) {
        params.append('request_latitude', myLocation.lat);
        params.append('request_longitude', myLocation.lng);
      }
      if (formData.city) {
        params.append('request_city', formData.city);
      }

      const res = await fetch(`${API_URL}/api/requests/suggest-hospitals?${params}`);
      const data = await res.json().catch(() => ({ suggestions: [] }));
      setSuggestions(data.suggestions || []);
    } catch (e) {
      console.error('Failed to fetch suggestions:', e);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getMyLocation = () => {
    setLocationError("");
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported. Use Enter manually.");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        setLocationError("");
        setLocationLoading(false);
        // Fetch suggestions after location is set
        setTimeout(() => {
          if (formData.bloodGroup && formData.component && formData.unitsRequired) {
            fetchSuggestions();
          }
        }, 100);
      },
      () => {
        setLocationError("Could not get location. Use Enter manually with your city.");
        setMyLocation(null);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const validateForm = () => {
    if (!formData.bloodGroup || !formData.component || !formData.unitsRequired || !formData.urgency || !formData.reason) {
      setErr("Blood group, component, units, urgency, and reason are required.");
      return false;
    }
    // Location is required - either GPS or city
    if (!myLocation && (!formData.city || !formData.city.trim())) {
      setErr("Location is required. Please use your GPS location or enter a city name.");
      return false;
    }
    if (formData.age && (Number(formData.age) <= 0 || Number(formData.age) > 120)) {
      setErr("Please enter a valid age");
      return false;
    }
    if (formData.contactNumber && !/^[6-9]\d{9}$/.test(formData.contactNumber)) {
      setErr("Enter a valid 10-digit mobile number");
      return false;
    }
    const u = Number(formData.unitsRequired);
    if (!u || u <= 0 || u > 10) {
      setErr("Units must be between 1 and 10");
      return false;
    }
    setErr("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setResult(null);
    try {
      const body = {
        request_city: formData.city.trim(),
        blood_group: formData.bloodGroup,
        component: formData.component,
        units_required: Number(formData.unitsRequired),
        urgency: formData.urgency,
        required_by: formData.requiredBy || null,
        reason: formData.reason,
        patient_id: user?.role === "PATIENT" ? user?.id : null,
      };
      if (myLocation) {
        body.request_latitude = myLocation.lat;
        body.request_longitude = myLocation.lng;
      }
      const res = await fetch(`${API_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
      setFormData((f) => ({ ...f, bloodGroup: "", component: "", unitsRequired: "", urgency: "", requiredBy: "", city: "", reason: "" }));
      setMyLocation(null);
      setTimeout(() => navigate("/patient/dashboard"), 3000);
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-red-600 mb-2">🩸 Blood Request Form</h2>
            <p className="text-gray-600">
              We notify hospitals within 10 km first. If a hospital has enough blood, it must approve before you’re notified as fulfilled. If no hospital has enough, we notify matching donors in your city.
            </p>
          </div>

          {err && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
              <p className="font-semibold">Error</p>
              <p>{err}</p>
            </div>
          )}

          {result && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span>✅</span> Request Created & Dispatched
              </h3>
              {result.awaitingHospitalApproval ? (
                <div className="space-y-2">
                  <p className="text-green-700">
                    <strong>⏳ Waiting for Hospital Approval</strong> A nearby hospital has enough inventory. The hospital must approve before status becomes fulfilled.
                  </p>
                  <p className="text-sm text-green-600">Inventory available: {result.inventoryAvailable} units</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-green-700">
                    <strong>Donors notified (same city):</strong> {result.matchedDonors?.length ?? 0}
                  </p>
                  <p className="text-green-700">
                    <strong>Notifications sent:</strong> {result.notificationCount ?? 0}
                  </p>
                  {result.inventoryAvailable > 0 && (
                    <p className="text-sm text-green-600">
                      Note: Hospital has {result.inventoryAvailable} units in inventory (insufficient for full request)
                    </p>
                  )}
                  {result.matchedDonors?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-green-700 mb-2">Matched Donors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-600">
                        {result.matchedDonors.slice(0, 5).map((d) => (
                          <li key={d.id}>
                            {d.full_name} – {d.blood_group}
                          </li>
                        ))}
                        {result.matchedDonors.length > 5 && <li>… and {result.matchedDonors.length - 5} more donors</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ---------- Location: Use my location or Enter manually ---------- */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Request Location *</label>
              <p className="text-xs text-gray-500 mb-3">
                Hospitals within 10 km are notified first; if none, entire city. Donors are contacted only if no hospital has enough.
              </p>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locationMode"
                    checked={locationMode === "my_location"}
                    onChange={() => { setLocationMode("my_location"); setLocationError(""); }}
                  />
                  <span>Use my location</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locationMode"
                    checked={locationMode === "manual"}
                    onChange={() => { setLocationMode("manual"); setMyLocation(null); setLocationError(""); }}
                  />
                  <span>Enter manually</span>
                </label>
              </div>
              {locationMode === "my_location" && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={getMyLocation}
                    disabled={locationLoading}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50"
                  >
                    {locationLoading ? "Getting…" : "📍 Get my location"}
                  </button>
                  {myLocation && (
                    <span className="ml-3 text-sm text-gray-600">
                      {myLocation.lat.toFixed(5)}, {myLocation.lng.toFixed(5)}
                    </span>
                  )}
                  {locationError && <p className="text-sm text-amber-600 mt-1">{locationError}</p>}
                </div>
              )}
              {myLocation && (
                <div className="h-48 rounded-lg overflow-hidden border border-gray-200 mb-3">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${myLocation.lng - 0.01},${myLocation.lat - 0.01},${myLocation.lng + 0.01},${myLocation.lat + 0.01}&layer=mapnik&marker=${myLocation.lat},${myLocation.lng}`}
                    title="Your location"
                    className="w-full h-full"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${myLocation.lat}&mlon=${myLocation.lng}&zoom=13`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View larger map
                    </a>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">City * (used if no hospital within 10 km)</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="city"
                  placeholder="e.g. Mumbai, Delhi"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Hospital Suggestions */}
            {suggestions.length > 0 && (
              <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🏥</span> Suggested Hospitals with Blood Availability
                </h3>
                {loadingSuggestions ? (
                  <p className="text-gray-600">Loading suggestions...</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {suggestions.map((hospital) => (
                      <div
                        key={hospital.id}
                        className={`p-4 rounded-lg border-2 ${
                          hospital.has_sufficient
                            ? "bg-green-50 border-green-300"
                            : hospital.status === "insufficient"
                            ? "bg-yellow-50 border-yellow-300"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{hospital.name}</h4>
                            <p className="text-sm text-gray-600">{hospital.city}</p>
                            {hospital.distance_meters != null && (
                              <p className="text-xs text-gray-500 mt-1">
                                📍 {((hospital.distance_meters / 1000).toFixed(2))} km away
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                hospital.has_sufficient
                                  ? "bg-green-200 text-green-800"
                                  : hospital.status === "insufficient"
                                  ? "bg-yellow-200 text-yellow-800"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {hospital.has_sufficient
                                ? "✅ Available"
                                : hospital.status === "insufficient"
                                ? "⚠️ Limited"
                                : "❌ Unavailable"}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {hospital.units_available} units available
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="patientName"
                  placeholder="Enter patient name"
                  value={formData.patientName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="age"
                  placeholder="Age"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group *</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Blood Group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Component *</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="component"
                  value={formData.component}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Component</option>
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="RBC">RBC</option>
                  <option value="Platelets">Platelets</option>
                  <option value="Plasma">Plasma</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Units Required *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="unitsRequired"
                  placeholder="1-10 units"
                  value={formData.unitsRequired}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency *</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Urgency</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Required By</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                name="requiredBy"
                value={formData.requiredBy}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                name="contactNumber"
                placeholder="10-digit mobile"
                value={formData.contactNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason *</label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition resize-none"
                name="reason"
                rows="4"
                placeholder="Reason (Accident, Surgery, etc.)"
                value={formData.reason}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-red-700 hover:to-red-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Dispatching…
                </>
              ) : (
                "🚀 Request Blood (Hospitals 10km / City → Donors)"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Request;
