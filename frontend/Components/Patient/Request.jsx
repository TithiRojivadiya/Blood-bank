import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";

const Request = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    bloodGroup: "",
    component: "",
    unitsRequired: "",
    urgency: "",
    requiredBy: "",
    hospitalId: "",
    city: "",
    contactNumber: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/hospitals`)
      .then((r) => r.json())
      .then(setHospitals)
      .catch(() => setHospitals([]));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.bloodGroup || !formData.component || !formData.unitsRequired || !formData.urgency || !formData.hospitalId || !formData.reason) {
      setErr("Blood group, component, units, urgency, hospital, and reason are required.");
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
      const res = await fetch(`${API_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_id: formData.hospitalId,
          blood_group: formData.bloodGroup,
          component: formData.component,
          units_required: Number(formData.unitsRequired),
          urgency: formData.urgency,
          required_by: formData.requiredBy || null,
          reason: formData.reason,
          patient_id: user?.role === "PATIENT" ? user?.id : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
      setFormData((f) => ({ ...f, bloodGroup: "", component: "", unitsRequired: "", urgency: "", hospitalId: "", requiredBy: "", reason: "" }));
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 3000);
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
              Instant Dispatch: We notify donors within 5km. Fill details to get Smart Matching.
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
              {result.fulfilledFromInventory ? (
                <div className="space-y-2">
                  <p className="text-green-700">
                    <strong>✅ Fulfilled from Inventory!</strong> Your request has been fulfilled from available hospital inventory.
                  </p>
                  <p className="text-sm text-green-600">
                    Inventory available: {result.inventoryAvailable} units
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-green-700">
                    <strong>Matched donors (5km):</strong> {result.matchedDonors?.length ?? 0}
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
                            {d.full_name} – {d.blood_group} ({(d.distance_meters / 1000).toFixed(2)} km away)
                          </li>
                        ))}
                        {result.matchedDonors.length > 5 && (
                          <li>… and {result.matchedDonors.length - 5} more donors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital *</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                name="hospitalId"
                value={formData.hospitalId}
                onChange={handleChange}
                required
              >
                <option value="">Select Hospital</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} – {h.city || ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  name="city"
                  placeholder="City"
                  value={formData.city}
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
                "🚀 Request Blood (Instant Dispatch)"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f7f9fc", padding: "50px 20px", display: "flex", justifyContent: "center", alignItems: "flex-start" },
  card: { background: "#ffffff", padding: 35, width: "100%", maxWidth: 450, borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.1)" },
  heading: { textAlign: "center", color: "#c62828", marginBottom: 5 },
  subText: { textAlign: "center", fontSize: 14, color: "#666", marginBottom: 25 },
  input: { width: "100%", padding: 11, marginBottom: 14, borderRadius: 10, border: "1px solid #ddd", fontSize: 14 },
  textarea: { width: "100%", padding: 11, height: 80, borderRadius: 10, border: "1px solid #ddd", marginBottom: 18 },
  button: { width: "100%", padding: 13, backgroundColor: "#d32f2f", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, cursor: "pointer" },
  result: { background: "#e8f5e9", padding: 16, borderRadius: 12, marginBottom: 20 },
};

export default Request;
