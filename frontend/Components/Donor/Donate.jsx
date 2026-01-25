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
    donation_date: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [donorBloodGroup, setDonorBloodGroup] = useState("");

  useEffect(() => {
    if (!user?.id || user?.role !== "DONOR") {
      setLoading(false);
      return;
    }
    fetchNearestHospital();
    fetchDonorProfile();
  }, [user?.id]);

  const fetchDonorProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile?role=DONOR&id=${user.id}`);
      const data = await res.json();
      if (res.ok && data && data.blood_group) {
        setDonorBloodGroup(data.blood_group);
      }
    } catch (err) {
      console.error("Failed to fetch donor profile:", err);
    }
  };

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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate date is not in the past
    if (name === "donation_date") {
      const today = new Date().toISOString().split("T")[0];
      if (value < today) {
        setError("Donation date cannot be in the past. Please select today or a future date.");
      } else {
        setError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nearestHospital) {
      setError("No hospital selected. Please refresh to find nearest hospital.");
      return;
    }
    
    if (!donorBloodGroup) {
      setError("Blood group not found in your profile. Please update your profile first.");
      return;
    }

    // Validate date is not in the past
    const today = new Date().toISOString().split("T")[0];
    if (formData.donation_date < today) {
      setError("Donation date cannot be in the past. Please select today or a future date.");
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
          donation_date: formData.donation_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record donation");
      setSuccess(true);
      setFormData({ donation_date: new Date().toISOString().split("T")[0] });
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

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">Schedule Blood Donation</h2>
        <p className="text-gray-600">Record your upcoming blood donation at a nearby hospital</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          {error.includes("location") && (
            <p className="text-sm mt-2">
              <a href="/donor/profile" className="text-blue-600 underline">
                Update your profile with location
              </a>
            </p>
          )}
          {error.includes("Blood group") && (
            <p className="text-sm mt-2">
              <a href="/donor/profile" className="text-blue-600 underline">
                Update your profile with blood group
              </a>
            </p>
          )}
        </div>
      )}

      {success && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-700 p-6 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-bold text-lg">Donation Scheduled Successfully!</p>
              <p className="text-sm mt-1">Your donation has been recorded. Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}

      {nearestHospital ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
          {/* Hospital Info Card */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <span className="text-3xl">🏥</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-blue-900 mb-2">📍 Nearest Hospital</h3>
                <p className="text-blue-800 font-semibold text-lg">{nearestHospital.name}</p>
                <p className="text-blue-700 text-sm mt-1">{nearestHospital.city}</p>
                {nearestHospital.distance_meters && (
                  <p className="text-blue-600 text-sm mt-2">
                    📍 Distance: <span className="font-semibold">{(nearestHospital.distance_meters / 1000).toFixed(2)} km</span> away
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Donor Blood Group Info */}
          {donorBloodGroup && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border-2 border-red-200">
              <p className="text-sm text-gray-600 mb-1">Your Blood Group:</p>
              <p className="text-2xl font-bold text-red-700">{donorBloodGroup}</p>
              <p className="text-xs text-gray-500 mt-1">This will be used for your donation</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Donation Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                min={today}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-lg"
                name="donation_date"
                value={formData.donation_date}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Select today or a future date for your donation
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Donation Details:</p>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Blood Group:</span> {donorBloodGroup || "Not set in profile"}</p>
                <p><span className="font-semibold">Component:</span> Whole Blood</p>
                <p><span className="font-semibold">Units:</span> 1</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || success || !donorBloodGroup}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                !submitting && !success && donorBloodGroup
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Scheduling...
                </span>
              ) : (
                "🩸 Schedule Donation"
              )}
            </button>
          </form>

          {!donorBloodGroup && (
            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Please update your profile with your blood group before scheduling a donation.
              </p>
              <a
                href="/donor/profile"
                className="text-blue-600 hover:underline text-sm font-medium mt-2 inline-block"
              >
                Go to Profile →
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-100">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Hospital Found</h3>
          <p className="text-gray-600 mb-6 text-lg">
            We couldn't find a hospital within 50km of your location. Please update your location in your profile to find nearby hospitals.
          </p>
          <button
            onClick={() => navigate("/donor/profile")}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition shadow-lg hover:shadow-xl font-semibold"
          >
            Update Profile Location
          </button>
        </div>
      )}
    </div>
  );
};

export default Donate;
