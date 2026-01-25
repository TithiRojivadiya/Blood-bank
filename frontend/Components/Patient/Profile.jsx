import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: "", email: "", phone: "", city: "" });

  useEffect(() => {
    if (!user?.id || user?.role !== "PATIENT") {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/api/profile?role=PATIENT&id=${user.id}`)
      .then((r) => r.json())
      .then((d) =>
        setProfileData({
          full_name: d.full_name ?? "",
          email: d.email ?? "",
          phone: d.phone ?? "",
          city: d.city ?? "",
        })
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  const handleChange = (e) => setProfileData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = () => {
    fetch(`${API_URL}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "PATIENT", id: user.id, full_name: profileData.full_name, phone: profileData.phone, city: profileData.city }),
    })
      .then((r) => r.json())
      .then(() => { alert("Profile updated."); setIsEditing(false); })
      .catch(() => alert("Failed to update."));
  };

  if (loading) return <p className="p-6 text-gray-500">Loading profile…</p>;
  if (!user?.id) return <p className="p-6 text-gray-500">Log in to view profile.</p>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>My Profile</h1>
        <p style={styles.subText}>View and update your personal information</p>
        <label style={styles.label}>Full Name</label>
        <input style={styles.input} name="full_name" value={profileData.full_name} disabled={!isEditing} onChange={handleChange} />
        <label style={styles.label}>Email</label>
        <input style={styles.input} name="email" value={profileData.email} disabled readOnly />
        <label style={styles.label}>Phone</label>
        <input style={styles.input} name="phone" value={profileData.phone} disabled={!isEditing} onChange={handleChange} />
        <label style={styles.label}>City / Area</label>
        <input style={styles.input} name="city" value={profileData.city} disabled={!isEditing} onChange={handleChange} />
        {!isEditing ? (
          <button style={styles.editButton} onClick={() => setIsEditing(true)}>Edit Profile</button>
        ) : (
          <button style={styles.saveButton} onClick={handleSave}>Save</button>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f7f9fc", padding: "50px 20px", display: "flex", justifyContent: "center", alignItems: "flex-start" },
  card: { background: "#ffffff", padding: 35, width: "100%", maxWidth: 420, borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.1)" },
  heading: { textAlign: "center", color: "#c62828", marginBottom: 6 },
  subText: { textAlign: "center", fontSize: 14, color: "#666", marginBottom: 25 },
  label: { fontSize: 13, fontWeight: 600, color: "#444" },
  input: { width: "100%", padding: 11, marginBottom: 16, marginTop: 4, borderRadius: 10, border: "1px solid #ddd", backgroundColor: "#fafafa", fontSize: 14 },
  editButton: { width: "100%", padding: 12, backgroundColor: "#d32f2f", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, cursor: "pointer" },
  saveButton: { width: "100%", padding: 12, backgroundColor: "#2e7d32", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, cursor: "pointer" },
};

export default Profile;
