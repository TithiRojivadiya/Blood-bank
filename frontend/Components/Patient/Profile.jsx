import { useState } from "react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: null,
    email: null,
    phoneNumber: null,
    city: null
  });

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // Later: API call to update profile
    console.log("Updated Profile Data:", profileData);
    alert("✅ Profile updated successfully!");
    setIsEditing(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>My Profile</h1>
        <p style={styles.subText}>View and update your personal information</p>

        {/* Full Name */}
        <label style={styles.label}>Full Name</label>
        <input
          style={styles.input}
          name="fullName"
          value={profileData.fullName ?? "null"}
          disabled={!isEditing}
          onChange={handleChange}
        />

        {/* Email */}
        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          name="email"
          value={profileData.email ?? "null"}
          disabled={!isEditing}
          onChange={handleChange}
        />

        {/* Phone Number */}
        <label style={styles.label}>Phone Number</label>
        <input
          style={styles.input}
          name="phoneNumber"
          value={profileData.phoneNumber ?? "null"}
          disabled={!isEditing}
          onChange={handleChange}
          pattern="[6-9][0-9]{9}"
          title="Phone number must start with 6, 7, 8, or 9"
        />

        {/* City */}
        <label style={styles.label}>City / Area</label>
        <input
          style={styles.input}
          name="city"
          value={profileData.city ?? "null"}
          disabled={!isEditing}
          onChange={handleChange}
        />

        {/* Buttons */}
        {!isEditing ? (
          <button style={styles.editButton} onClick={handleEditToggle}>
            Edit Profile
          </button>
        ) : (
          <button style={styles.saveButton} onClick={handleSave}>
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f7f9fc",
    padding: "50px 20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start"
  },
  card: {
    background: "#ffffff",
    padding: "35px",
    width: "100%",
    maxWidth: "420px",
    borderRadius: "16px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.1)"
  },
  heading: {
    textAlign: "center",
    color: "#c62828",
    marginBottom: "6px"
  },
  subText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#666",
    marginBottom: "25px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#444"
  },
  input: {
    width: "100%",
    padding: "11px",
    marginBottom: "16px",
    marginTop: "4px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    backgroundColor: "#fafafa",
    fontSize: "14px"
  },
  editButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    cursor: "pointer"
  },
  saveButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#2e7d32",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    cursor: "pointer"
  }
};

export default Profile;
