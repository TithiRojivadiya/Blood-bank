import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";
import { useNavigate } from "react-router";

const Donate = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [nearestHospital, setNearestHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    blood_group: "",
    component: "Whole Blood",
    units: 1,
    donation_date: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user?.id || user?.role !== "DONOR") {
      setLoading(false);
      return;
    }
    fetchNearestHospital();
  }, [user?.id]);

  const fetchNearestHospital = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/donations/nearest-hospital/${user.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not find nearest hospital. Please ensure your location is set in your profile.");
        setNearestHospital(null);
      } else {
        setNearestHospital(data);
        setError("");
      }
    } catch (err) {
      setError("Failed to find nearest hospital. Please try again.");
      setNearestHospital(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nearestHospital) {
      setError("No hospital selected. Please refresh to find nearest hospital.");
      return;
    }
    if (!formData.blood_group || !formData.component) {
      setError("Blood group and component are required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_id: user.id,
          hospital_id: nearestHospital.id,
          blood_group: formData.blood_group,
          component: formData.component,
          units: Number(formData.units) || 1,
          donation_date: formData.donation_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record donation");
      setSuccess(true);
      setFormData({ blood_group: "", component: "Whole Blood", units: 1, donation_date: new Date().toISOString().split("T")[0] });
      setTimeout(() => {
        setSuccess(false);
        navigate("/donor/dashboard");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to record donation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user?.id || user?.role !== "DONOR") {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500">Please log in as a donor to record a donation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Record Blood Donation</h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          {error.includes("location") && (
            <p className="text-sm mt-2">
              <a href="/donor/profile" className="text-blue-600 underline">
                Update your profile with location
              </a>
            </p>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6">
          <p className="font-semibold">✅ Donation Recorded Successfully!</p>
          <p className="text-sm">Redirecting to dashboard...</p>
        </div>
      )}

      {nearestHospital ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">📍 Nearest Hospital</h3>
            <p className="text-blue-800 font-medium">{nearestHospital.name}</p>
            <p className="text-sm text-blue-600">{nearestHospital.city}</p>
            {nearestHospital.distance_meters && (
              <p className="text-sm text-blue-600 mt-1">
                Distance: {(nearestHospital.distance_meters / 1000).toFixed(2)} km away
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group *</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                required
              >
                <option value="">Select Blood Group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
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
                <option value="Whole Blood">Whole Blood</option>
                <option value="RBC">RBC</option>
                <option value="Platelets">Platelets</option>
                <option value="Plasma">Plasma</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Units *</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Donation Date *</label>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="donation_date"
                  value={formData.donation_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || success}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-red-700 hover:to-red-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Recording…
                </>
              ) : (
                "🩸 Record Donation"
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Hospital Found</h3>
          <p className="text-gray-600 mb-6">
            We couldn't find a hospital within 50km of your location. Please update your location in your profile.
          </p>
          <button
            onClick={() => navigate("/donor/profile")}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            Update Profile Location
          </button>
        </div>
      )}
    </div>
  );
};

export default Donate;
