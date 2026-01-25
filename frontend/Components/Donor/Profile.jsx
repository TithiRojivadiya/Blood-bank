import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    blood_group: "",
    city: "",
    age: "",
    last_donation_date: "",
    is_available: true,
  });

  useEffect(() => {
    if (!user?.id || user?.role !== "DONOR") return;
    fetch(`${API_URL}/api/profile?role=DONOR&id=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setProfileData({
          full_name: d.full_name ?? "",
          email: d.email ?? "",
          phone: d.phone ?? "",
          blood_group: d.blood_group ?? "",
          city: d.city ?? "",
          age: d.age ?? "",
          last_donation_date: d.last_donation_date ? d.last_donation_date.slice(0, 10) : "",
          is_available: d.is_available !== false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((p) => ({ ...p, [name]: value }));
  };

  const toggleAvailability = () => {
    setProfileData((p) => ({ ...p, is_available: !p.is_available }));
  };

  const handleSave = () => {
    fetch(`${API_URL}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "DONOR",
        id: user.id,
        full_name: profileData.full_name,
        phone: profileData.phone,
        city: profileData.city,
        age: profileData.age || null,
        last_donation_date: profileData.last_donation_date || null,
        is_available: profileData.is_available,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        alert("Profile updated.");
        setIsEditing(false);
      })
      .catch(() => alert("Failed to update."));
  };

  if (loading) return <p className="p-6 text-gray-500">Loading profile…</p>;
  if (!user?.id) return <p className="p-6 text-gray-500">Log in to view profile.</p>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>My Profile</h2>
        <p style={styles.subText}>Manage your personal and donation details</p>

        <label style={styles.label}>Full Name</label>
        <input style={styles.input} name="full_name" value={profileData.full_name} disabled={!isEditing} onChange={handleChange} />

        <label style={styles.label}>Email</label>
        <input style={styles.input} name="email" value={profileData.email} disabled readOnly />

        <label style={styles.label}>Phone</label>
        <input style={styles.input} name="phone" value={profileData.phone} disabled={!isEditing} onChange={handleChange} />

        <label style={styles.label}>Blood Group</label>
        <input style={styles.input} name="blood_group" value={profileData.blood_group} disabled readOnly />

        <label style={styles.label}>City / Area</label>
        <input style={styles.input} name="city" value={profileData.city} disabled={!isEditing} onChange={handleChange} />

        <label style={styles.label}>Age</label>
        <input style={styles.input} type="number" name="age" value={profileData.age} disabled={!isEditing} onChange={handleChange} />

        <label style={styles.label}>Last Blood Donation (optional)</label>
        <input style={styles.input} type="date" name="last_donation_date" value={profileData.last_donation_date} disabled={!isEditing} onChange={handleChange} />

        <label style={styles.label}>Availability</label>
        <div style={styles.switch} onClick={isEditing ? toggleAvailability : undefined}>
          <div style={{ ...styles.slider, transform: profileData.is_available ? "translateX(26px)" : "translateX(0)", backgroundColor: profileData.is_available ? "#2e7d32" : "#c62828" }} />
        </div>
        <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: profileData.is_available ? "#2e7d32" : "#c62828", marginBottom: 22 }}>
          {profileData.is_available ? "Available" : "Not Available"}
        </p>

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
  page: { minHeight: "100vh", backgroundColor: "#f7f9fc", padding: "50px 20px", display: "flex", justifyContent: "center" },
  card: { background: "#fff", padding: 36, width: "100%", maxWidth: 450, borderRadius: 18, boxShadow: "0 15px 35px rgba(0,0,0,0.12)" },
  heading: { textAlign: "center", color: "#c62828", marginBottom: 6 },
  subText: { textAlign: "center", fontSize: 14, color: "#666", marginBottom: 28 },
  label: { fontSize: 13, fontWeight: 600, color: "#444" },
  input: { width: "100%", padding: 11, marginTop: 5, marginBottom: 16, borderRadius: 10, border: "1px solid #ddd", backgroundColor: "#fafafa" },
  switch: { width: 56, height: 30, backgroundColor: "#eee", borderRadius: 30, position: "relative", cursor: "pointer", marginBottom: 8 },
  slider: { width: 24, height: 24, borderRadius: "50%", position: "absolute", top: 3, left: 3, transition: "0.3s ease" },
  editButton: { width: "100%", padding: 13, backgroundColor: "#d32f2f", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, cursor: "pointer" },
  saveButton: { width: "100%", padding: 13, backgroundColor: "#2e7d32", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, cursor: "pointer" },
};

export default Profile;
