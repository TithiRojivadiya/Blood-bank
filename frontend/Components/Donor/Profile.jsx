import { useState } from "react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: null,
    email: null,
    phoneNumber: null,
    bloodGroup: null,
    city: null,
    age: null,
    lastDonationDate: null,
    availability: "Available"
  });

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const toggleAvailability = () => {
    if (!isEditing) return;
    setProfileData({
      ...profileData,
      availability:
        profileData.availability === "Available"
          ? "Not Available"
          : "Available"
    });
  };

  const handleSave = () => {
    alert("✅ Profile updated successfully!");
    setIsEditing(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>My Profile</h2>
        <p style={styles.subText}>
          Manage your personal and donation details
        </p>

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

        {/* Blood Group */}
        <label style={styles.label}>Blood Group</label>
        <input
          style={styles.input}
          name="bloodGroup"
          value={profileData.bloodGroup ?? "null"}
          disabled={!isEditing}
          onChange={handleChange}
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

        {/* Age */}
        <label style={styles.label}>Age</label>
        <input
          style={styles.input}
          type="number"
          name="age"
          value={profileData.age ?? "null"}
          disabled={!isEditing}
          onChange={handleChange}
        />

        {/* Last Donation Date */}
        <label style={styles.label}>
          Last Blood Donation Date <span style={{ color: "#888" }}>(optional)</span>
        </label>
        <input
          style={styles.input}
          type="date"
          name="lastDonationDate"
          value={profileData.lastDonationDate ?? ""}
          disabled={!isEditing}
          onChange={handleChange}
        />

        {/* Availability Toggle */}
        <label style={styles.label}>Availability Status</label>
        <div
          style={{
            ...styles.toggle,
            backgroundColor:
              profileData.availability === "Available"
                ? "#c8e6c9"
                : "#ffcdd2"
          }}
          onClick={toggleAvailability}
        >
          <span
            style={{
              ...styles.toggleText,
              color:
                profileData.availability === "Available"
                  ? "#2e7d32"
                  : "#c62828"
            }}
          >
            {profileData.availability}
          </span>
        </div>

        {/* Buttons */}
        {!isEditing ? (
          <button style={styles.editButton} onClick={() => setIsEditing(true)}>
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
    justifyContent: "center"
  },
  card: {
    background: "#fff",
    padding: "36px",
    width: "100%",
    maxWidth: "450px",
    borderRadius: "18px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.12)"
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
    marginBottom: "28px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#444"
  },
  input: {
    width: "100%",
    padding: "11px",
    marginTop: "5px",
    marginBottom: "16px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    backgroundColor: "#fafafa"
  },
  toggle: {
    padding: "12px",
    borderRadius: "12px",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "22px"
  },
  toggleText: {
    fontWeight: "600"
  },
  editButton: {
    width: "100%",
    padding: "13px",
    backgroundColor: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontSize: "15px",
    cursor: "pointer"
  },
  saveButton: {
    width: "100%",
    padding: "13px",
    backgroundColor: "#2e7d32",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontSize: "15px",
    cursor: "pointer"
  }
};

export default Profile;
