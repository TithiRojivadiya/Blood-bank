import React from "react";
import { useNavigate } from "react-router";

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <span style={styles.navLogo}>🩸 RedHope</span>
        </div>
        <div style={styles.navLinks}>
          <button onClick={() => scrollTo("home")}>Home</button>
          <button onClick={() => scrollTo("mission")}>Our Mission</button>
          <button onClick={() => scrollTo("why")}>Why RedHope?</button>
          <button onClick={() => scrollTo("who")}>Who Is It For?</button>
          <button style={styles.navLogin} onClick={() => navigate("/login")}>Login</button>
          <button onClick={() => scrollTo("about")} style={styles.navAbout}>About Us</button>
        </div>
      </nav>

      {/* Home */}
      <section id="home" style={styles.hero}>
        <h1 style={styles.title}>RedHope</h1>
        <b><p style={styles.subtitle}>Saving Lives, One Drop at a Time</p></b>
        <p style={styles.description}>
          RedHope is a digital blood donation platform designed to bridge the gap
          between donors, patients, and blood banks. In emergencies, minutes
          matter — and RedHope ensures faster access to the right blood, at the
          right place, at the right time.
        </p>
      </section>

      {/* Our Mission */}
      <section id="mission" style={styles.section}>

        <b><h2 style={styles.sectionTitle}>Our Mission</h2></b>
        <p style={styles.sectionText}>
          Our mission is to create a reliable, transparent, and efficient blood
          donation ecosystem. We aim to eliminate delays, reduce dependency on
          manual processes, and ensure that no life is lost due to unavailability
          of blood.
        </p>
        <p style={styles.sectionText}>
          By leveraging technology, RedHope empowers donors to contribute
          meaningfully, helps patients get timely support, and enables blood
          banks to manage inventory effectively.
        </p>
      </section>

      {/* Why RedHope */}
      <section id="why" style={styles.sectionAlt}>
        <b><h2 style={styles.sectionTitle}>Why RedHope?</h2></b>
        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMY41GXZBpe6hZgN2wzmtutIFNUgYGUaHzkw&s"
              alt="Real-time"
              style={styles.cardImage}
            />
            <b><h3>⚡ Real-Time System</h3></b>
            <p>Instant access to donor availability and blood inventory during emergencies.</p>
          </div>
          <div style={styles.card}>
            <img
              src="https://img.freepik.com/free-vector/shield-lock-cartoon-style_78370-1621.jpg?semt=ais_user_personalization&w=740&q=80"
              alt="Secure"
              style={styles.cardImage}
            />
            <b><h3>🔐 Secure & Verified</h3></b>
            <p>Role-based access ensures safety and authenticity for all users.</p>
          </div>
          <div style={styles.card}>
            <img
              src="https://clipart-library.com/2024/goal-cliparts/goal-cliparts-15.png"
              alt="Purpose"
              style={styles.cardImage}
            />
            <b><h3>❤️ Purpose Driven</h3></b>
            <p>Built with a single goal — saving lives through faster response.</p>
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section id="who" style={styles.section}>
        <b><h2 style={styles.sectionTitle}>Who Is It For?</h2></b>
        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr2zckdDKK5Uml_38p9XfjRAkuEVUiNKHGMQ&s"
              alt="Donors"
              style={styles.cardImage}
            />
            <b><h3>Donors</h3></b>
            <p>Register once, receive notifications, and help save lives whenever you can.</p>
          </div>
          <div style={styles.card}>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3cRiI_ExLG4t4Gu6FrTyzfIKIuJF4u2kp1Q&s"
              alt="Patients"
              style={styles.cardImage}
            />
            <b><h3>Patients</h3></b>
            <p>Request blood quickly and get connected to nearby verified sources.</p>
          </div>
          <div style={styles.card}>
            <img
              src="https://www.clipartmax.com/png/middle/55-550830_hospital-clipart-transparent-background-hospital-clipart.png"
              alt="Blood Banks"
              style={styles.cardImage}
            />
            <b><h3>Blood Banks</h3></b>
            <p>Maintain inventory, manage requests, and respond efficiently.</p>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" style={styles.aboutSection}>
        <b><h2 style={styles.sectionTitle}>About RedHope</h2></b>
        <p style={styles.sectionText}>
          RedHope is a revolutionary platform transforming blood donation through real-time connectivity, ensuring every drop counts in saving lives.
        </p>

        {/* How It Works */}
        <div style={styles.aboutSubSection}>
          <h3 style={styles.subTitle}>How It Works</h3>
          <div style={styles.stepsContainer}>
            <div style={styles.stepCard}>
              <img src="https://cdn-icons-png.flaticon.com/512/1250/1250615.png" alt="Register" style={styles.stepImage} />
              <div style={styles.stepIcon}>1</div>
              <h4 style={styles.stepTitle}>Register</h4>
              <p style={styles.stepText}>Sign up as a donor, patient, or hospital in minutes.</p>
            </div>
            <div style={styles.stepCard}>
              <img src="https://cdn-icons-png.flaticon.com/512/2910/2910760.png" alt="Alerts" style={styles.stepImage} />
              <div style={styles.stepIcon}>2</div>
              <h4 style={styles.stepTitle}>Get Alerts</h4>
              <p style={styles.stepText}>Receive real-time notifications for blood needs nearby.</p>
            </div>
            <div style={styles.stepCard}>
              <img src="https://cdn-icons-png.flaticon.com/512/2910/2910761.png" alt="Connect & Donate" style={styles.stepImage} />
              <div style={styles.stepIcon}>3</div>
              <h4 style={styles.stepTitle}>Connect & Donate</h4>
              <p style={styles.stepText}>Safely connect with donors or hospitals to save lives.</p>
            </div>
          </div>
        </div>

        {/* Our Team */}
        <div style={styles.aboutSubSection}>
          <h3 style={styles.subTitle}>Our Team</h3>
          <img src="https://cdn-icons-png.flaticon.com/512/1995/1995574.png" alt="Team" style={styles.teamImage} />
          <p style={styles.aboutText}>
            A passionate group of healthcare professionals, tech experts, and volunteers committed to making blood donation accessible and efficient worldwide.
          </p>
        </div>

        {/* Impact */}
        <div style={styles.aboutSubSection}>
          <h3 style={styles.subTitle}>Impact</h3>
          <div style={styles.impactCards}>
            <div style={styles.impactCard}>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgsgnrTem3KLvoyf1qS4W8faSzyUXx9njOaw&s" alt="Donation" style={styles.impactImage} />
              <h4 style={styles.impactNumber}>5000+</h4>
              <p style={styles.impactText}>Donations facilitated</p>
            </div>
            <div style={styles.impactCard}>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQB0eOSqr6U8pIExmoBWTZRrrLRg96PIMfvg&s" alt="Lives saved" style={styles.impactImage} />
              <h4 style={styles.impactNumber}>1000+</h4>
              <p style={styles.impactText}>Lives saved</p>
            </div>
            <div style={styles.impactCard}>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0hrblxZlBbU66He129J0lQBj7syLDRAB9MA&s" alt="Volunteers" style={styles.impactImage} />
              <h4 style={styles.impactNumber}>200+</h4>
              <p style={styles.impactText}>Volunteers & partners</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Styles
const styles = {
  container: { fontFamily: "'Poppins', sans-serif", color: "#b71c1c" },
  navbar: { position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 40px", background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)", boxShadow: "0 8px 20px rgba(198,40,40,0.15)" },
  navLeft: { display: "flex", alignItems: "center" },
  navLogo: { fontSize: "22px", fontWeight: "900", color: "#c62828", letterSpacing: "1px" },
  navLinks: { display: "flex", alignItems: "center", gap: "18px" },
  navLogin: { padding: "8px 18px", backgroundColor: "#c62828", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", boxShadow: "0 5px 12px rgba(198,40,40,0.4)" },
  navAbout: { padding: "8px 16px", background: "transparent", color: "#c62828", border: "2px solid #c62828", borderRadius: "10px", fontWeight: "600", cursor: "pointer" },

  hero: { padding: "100px 20px", textAlign: "center", background: "linear-gradient(135deg, #fff, #ffebee)" },
  heroImage: { width: "120px", marginBottom: "20px" },
  title: { fontSize: "64px", fontWeight: "900" },
  subtitle: { fontSize: "24px", marginTop: "10px" },
  description: { maxWidth: "750px", margin: "30px auto", fontSize: "18px", lineHeight: "1.7" },
  section: { padding: "80px 20px", textAlign: "center" },
  sectionAlt: { padding: "80px 20px", textAlign: "center", backgroundColor: "#fff" },
  sectionTitle: { fontSize: "32px", marginBottom: "30px" },
  sectionText: { maxWidth: "750px", margin: "0 auto 20px", fontSize: "18px" },
  sectionImage: { width: "150px", marginBottom: "20px" },
  cardContainer: { display: "flex", justifyContent: "center", gap: "25px", flexWrap: "wrap", marginTop: "40px" },
  card: { backgroundColor: "#ffffff", padding: "25px", borderRadius: "15px", width: "260px", boxShadow: "0 10px 20px rgba(0,0,0,0.1)", textAlign: "center" },
  cardImage: { width: "60px", height: "60px", marginBottom: "15px" },

  aboutSection: { padding: "80px 20px", background: "linear-gradient(135deg, #fff0f0 0%, #ffcdd2 100%)", textAlign: "center", color: "#b71c1c" },
  aboutSubSection: { marginTop: "50px" },
  subTitle: { fontSize: "28px", fontWeight: "700", marginBottom: "25px", color: "#c62828" },
  stepsContainer: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "30px" },
  stepCard: { backgroundColor: "#ffffff", padding: "25px", borderRadius: "15px", width: "220px", boxShadow: "0 15px 25px rgba(198,40,40,0.15)", textAlign: "center", transition: "transform 0.3s ease" },
  stepIcon: { width: "60px", height: "60px", margin: "0 auto 15px", backgroundColor: "#c62828", color: "#fff", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px", fontWeight: "700" },
  stepTitle: { fontSize: "20px", fontWeight: "700", marginBottom: "10px" },
  stepText: { fontSize: "16px", lineHeight: "1.6" },
  stepImage: { width: "80px", height: "80px", marginBottom: "15px" },

  aboutText: { fontSize: "18px", lineHeight: "1.7", maxWidth: "800px", margin: "0 auto" },
  teamImage: { width: "120px", height: "120px", margin: "20px auto", display: "block" },

  impactCards: { display: "flex", justifyContent: "center", gap: "25px", flexWrap: "wrap", marginTop: "30px" },
  impactCard: { background: "white", padding: "25px", borderRadius: "15px", width: "180px", boxShadow: "0 12px 20px rgba(198,40,40,0.2)", transition: "transform 0.3s ease", textAlign: "center" },
  impactNumber: { fontSize: "28px", fontWeight: "800", color: "#c62828", marginBottom: "5px" },
  impactText: { fontSize: "16px", fontWeight: "500" },
  impactImage: { width: "60px", height: "60px", marginBottom: "10px" },
};

export default LandingPage;
