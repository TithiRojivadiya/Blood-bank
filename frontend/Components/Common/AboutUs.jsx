import React from "react";
import { useNavigate } from "react-router";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate("/")}>
        ← Back to Home
      </button>

      <div style={styles.content}>
        <h1 style={styles.title}>About RedHope</h1>
        <p style={styles.intro}>
          RedHope is a revolutionary platform dedicated to revolutionizing blood donation through real-time connectivity, ensuring that every drop counts in saving lives.
        </p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Our Mission</h2>
          <p style={styles.text}>
            To bridge the gap between blood donors and those in need by providing a seamless, real-time platform that connects verified donors with hospitals and emergency services instantly.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.steps}>
            <div style={styles.step}>
              <div style={styles.stepIcon}>1</div>
              <p>Register as a donor or hospital</p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepIcon}>2</div>
              <p>Receive real-time alerts for blood needs</p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepIcon}>3</div>
              <p>Connect and donate or receive blood securely</p>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Our Team</h2>
          <p style={styles.text}>
            A passionate group of healthcare professionals, tech experts, and volunteers committed to making blood donation accessible and efficient worldwide.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Impact</h2>
          <p style={styles.text}>
            Since our inception, RedHope has facilitated thousands of donations, saving countless lives and building a community of heroes.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(135deg, #ffffff 0%, #ffebee 50%, #ffcdd2 100%)",
    fontFamily: "'Poppins', sans-serif",
    color: "#c62828",
    padding: "20px",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: "20px",
    left: "20px",
    padding: "10px 20px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "10px",
    border: "2px solid #c62828",
    backgroundColor: "transparent",
    color: "#c62828",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  content: {
    maxWidth: "900px",
    margin: "80px auto 0",
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: "50px",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(198,40,40,0.2)",
    border: "2px solid #c62828",
  },
  title: {
    fontSize: "48px",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: "30px",
    background: "linear-gradient(45deg, #c62828, #e53935)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  intro: {
    fontSize: "20px",
    textAlign: "center",
    marginBottom: "50px",
    lineHeight: "1.6",
    color: "#b71c1c",
  },
  section: {
    marginBottom: "40px",
  },
  sectionTitle: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#c62828",
  },
  text: {
    fontSize: "18px",
    lineHeight: "1.7",
    color: "#b71c1c",
  },
  steps: {
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: "20px",
  },
  step: {
    textAlign: "center",
    flex: "1 1 200px",
  },
  stepIcon: {
    width: "60px",
    height: "60px",
    backgroundColor: "#c62828",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 auto 15px",
  },
};

// Hover effects
styles.backButton[':hover'] = {
  backgroundColor: "#c62828",
  color: "#fff",
};

export default AboutUs;