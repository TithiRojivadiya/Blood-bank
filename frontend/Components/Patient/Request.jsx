import { useState } from "react";

const Request = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    bloodGroup: "",
    component: "",
    unitsRequired: "",
    urgency: "",
    requiredBy: "",
    hospitalName: "",
    city: "",
    contactNumber: "",
    reason: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    for (let key in formData) {
      if (!formData[key]) {
        alert(`❌ ${key.replace(/([A-Z])/g, " $1")} is required`);
        return false;
      }
    }

    if (formData.age <= 0 || formData.age > 120) {
      alert("❌ Please enter a valid age");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(formData.contactNumber)) {
      alert("❌ Enter a valid 10-digit mobile number");
      return false;
    }

    if (formData.unitsRequired <= 0 || formData.unitsRequired > 10) {
      alert("❌ Units must be between 1 and 10");
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    console.log("Request Data:", formData);
    alert("✅ Blood request submitted successfully!");

    setFormData({
      patientName: "",
      age: "",
      bloodGroup: "",
      component: "",
      unitsRequired: "",
      urgency: "",
      requiredBy: "",
      hospitalName: "",
      city: "",
      contactNumber: "",
      reason: ""
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Blood Request Form</h2>
        <p style={styles.subText}>
          Please fill all details carefully. This helps us respond faster.
        </p>

        <form onSubmit={handleSubmit}>
          <input style={styles.input} name="patientName" placeholder="Patient Name" value={formData.patientName} onChange={handleChange} />
          <input style={styles.input} type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} />

          <select style={styles.input} name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
            <option value="">Blood Group</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select style={styles.input} name="component" value={formData.component} onChange={handleChange}>
            <option value="">Blood Component</option>
            <option>Whole Blood</option>
            <option>RBC</option>
            <option>Platelets</option>
            <option>Plasma</option>
          </select>

          <input style={styles.input} type="number" name="unitsRequired" placeholder="Units Required" value={formData.unitsRequired} onChange={handleChange} />

          <select style={styles.input} name="urgency" value={formData.urgency} onChange={handleChange}>
            <option value="">Urgency</option>
            <option>Normal</option>
            <option>Urgent</option>
            <option>Emergency</option>
          </select>

          <input style={styles.input} type="datetime-local" name="requiredBy" value={formData.requiredBy} onChange={handleChange} />

          <select
            style={styles.input}
            name="hospitalName"
            value={formData.hospitalName}
            onChange={handleChange}
          >
            <option value="">Select Hospital</option>
            <option value="Apex Heart & Trauma Centre">Apex Heart & Trauma Centre</option>
            <option value="CityCare Multispeciality Hospital">CityCare Multispeciality Hospital</option>
            <option value="Green Valley Medical Institute">Green Valley Medical Institute</option>
            <option value="Harmony Care Hospital">Harmony Care Hospital</option>
            <option value="Hopewell Medical College & Hospital">Hopewell Medical College & Hospital</option>
            <option value="LifeSpring General Hospital">LifeSpring General Hospital</option>
            <option value="MediTrust Health Centre">MediTrust Health Centre</option>
            <option value="PrimeCare Multispeciality Hospital">PrimeCare Multispeciality Hospital</option>
            <option value="Silverline Medical & Research Hospital">Silverline Medical & Research Hospital</option>
            <option value="Sunrise Super Speciality Hospital">Sunrise Super Speciality Hospital</option>
          </select>


          <input style={styles.input} name="city" placeholder="City" value={formData.city} onChange={handleChange} />
          <input style={styles.input} name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleChange} />

          <textarea style={styles.textarea} name="reason" placeholder="Reason (Accident, Surgery, etc.)" value={formData.reason} onChange={handleChange} />

          <button style={styles.button} type="submit">
            Request Blood
          </button>
        </form>
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
    maxWidth: "450px",
    borderRadius: "16px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.1)"
  },
  heading: {
    textAlign: "center",
    color: "#c62828",
    marginBottom: "5px"
  },
  subText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#666",
    marginBottom: "25px"
  },
  input: {
    width: "100%",
    padding: "11px",
    marginBottom: "14px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "14px"
  },
  textarea: {
    width: "100%",
    padding: "11px",
    height: "80px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    marginBottom: "18px"
  },
  button: {
    width: "100%",
    padding: "13px",
    backgroundColor: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    cursor: "pointer"
  }
};

export default Request;
