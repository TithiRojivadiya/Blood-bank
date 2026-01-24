import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";

const Request = () => {
  const { user } = useContext(AuthContext);
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
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Blood Request Form</h2>
        <p style={styles.subText}>
          Instant Dispatch: we notify donors within 5km. Fill details to get Smart Matching.
        </p>

        {err && <p style={{ color: "#c62828", fontSize: 14, marginBottom: 12 }}>{err}</p>}

        {result && (
          <div style={styles.result}>
            <h3 style={{ color: "#2e7d32", marginBottom: 8 }}>Request created &amp; dispatched</h3>
            <p><strong>Matched donors (5km):</strong> {result.matchedDonors?.length ?? 0}</p>
            <p><strong>Notifications sent:</strong> {result.notificationCount ?? 0}</p>
            {result.matchedDonors?.length > 0 && (
              <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 13 }}>
                {result.matchedDonors.slice(0, 5).map((d) => (
                  <li key={d.id}>{d.full_name} – {d.blood_group} ({(d.distance_meters / 1000).toFixed(2)} km)</li>
                ))}
                {result.matchedDonors.length > 5 && <li>… and {result.matchedDonors.length - 5} more</li>}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input style={styles.input} name="patientName" placeholder="Patient Name" value={formData.patientName} onChange={handleChange} />
          <input style={styles.input} type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} />

          <select style={styles.input} name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
            <option value="">Blood Group</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select style={styles.input} name="component" value={formData.component} onChange={handleChange}>
            <option value="">Blood Component</option>
            <option value="Whole Blood">Whole Blood</option>
            <option value="RBC">RBC</option>
            <option value="Platelets">Platelets</option>
            <option value="Plasma">Plasma</option>
          </select>

          <input style={styles.input} type="number" name="unitsRequired" placeholder="Units Required" value={formData.unitsRequired} onChange={handleChange} />

          <select style={styles.input} name="urgency" value={formData.urgency} onChange={handleChange}>
            <option value="">Urgency</option>
            <option value="Normal">Normal</option>
            <option value="Urgent">Urgent</option>
            <option value="Emergency">Emergency</option>
          </select>

          <input style={styles.input} type="datetime-local" name="requiredBy" value={formData.requiredBy} onChange={handleChange} />

          <select style={styles.input} name="hospitalId" value={formData.hospitalId} onChange={handleChange}>
            <option value="">Select Hospital</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name} – {h.city || ""}</option>
            ))}
          </select>

          <input style={styles.input} name="city" placeholder="City" value={formData.city} onChange={handleChange} />
          <input style={styles.input} name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleChange} />

          <textarea style={styles.textarea} name="reason" placeholder="Reason (Accident, Surgery, etc.)" value={formData.reason} onChange={handleChange} />

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Dispatching…" : "Request Blood (Instant Dispatch)"}
          </button>
        </form>
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
