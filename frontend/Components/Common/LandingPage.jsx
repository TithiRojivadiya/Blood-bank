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

          <button
            style={styles.navLogin}
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            style={styles.navAbout}
            onClick={() => navigate("/about-us")}
          >
            About Us
          </button>
        </div>
      </nav>


      {/* Home */}
      <section id="home" style={styles.hero}>
        <h1 style={styles.title}>RedHope</h1>
        <p style={styles.subtitle}>Saving Lives, One Drop at a Time</p>

        <p style={styles.description}>
          RedHope is a digital blood donation platform designed to bridge the gap
          between donors, patients, and blood banks. In emergencies, minutes
          matter — and RedHope ensures faster access to the right blood, at the
          right place, at the right time.
        </p>

        <div style={styles.buttonContainer}>
          <button style={styles.loginButton} onClick={() => navigate("/login")}>
            Login
          </button>
          <button style={styles.aboutButton} onClick={() => navigate("/about-us")}>
            About Us
          </button>
        </div>
      </section>

      {/* Our Mission */}
      <section id="mission" style={styles.section}>
        <h2 style={styles.sectionTitle}>Our Mission</h2>
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
        <h2 style={styles.sectionTitle}>Why RedHope?</h2>

        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <h3>⚡ Real-Time System</h3>
            <p>
              Instant access to donor availability and blood inventory during
              emergencies.
            </p>
          </div>

          <div style={styles.card}>
            <h3>🔐 Secure & Verified</h3>
            <p>
              Role-based access ensures safety and authenticity for all users.
            </p>
          </div>

          <div style={styles.card}>
            <h3>❤️ Purpose Driven</h3>
            <p>
              Built with a single goal — saving lives through faster response.
            </p>
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section id="who" style={styles.section}>
        <h2 style={styles.sectionTitle}>Who Is It For?</h2>

        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <h3>Donors</h3>
            <p>
              Register once, receive notifications, and help save lives whenever
              you can.
            </p>
          </div>

          <div style={styles.card}>
            <h3>Patients</h3>
            <p>
              Request blood quickly and get connected to nearby verified sources.
            </p>
          </div>

          <div style={styles.card}>
            <h3>Blood Banks</h3>
            <p>
              Maintain inventory, manage requests, and respond efficiently.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Poppins', sans-serif",
    color: "#b71c1c",
  },

  /* Navbar */
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  },

  navLogo: {
    margin: 0,
    fontWeight: "800",
  },

  navLinks: {
    display: "flex",
    gap: "15px",
  },

  hero: {
    padding: "100px 20px",
    textAlign: "center",
    background: "linear-gradient(135deg, #fff, #ffebee)",
  },

  title: {
    fontSize: "64px",
    fontWeight: "900",
  },

  subtitle: {
    fontSize: "24px",
    marginTop: "10px",
  },

  description: {
    maxWidth: "750px",
    margin: "30px auto",
    fontSize: "18px",
    lineHeight: "1.7",
  },

  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  },

  loginButton: {
    padding: "15px 35px",
    backgroundColor: "#c62828",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    cursor: "pointer",
  },

  aboutButton: {
    padding: "15px 35px",
    border: "2px solid #c62828",
    background: "transparent",
    color: "#c62828",
    borderRadius: "12px",
    fontSize: "16px",
    cursor: "pointer",
  },

  section: {
    padding: "80px 20px",
    textAlign: "center",
  },

  sectionAlt: {
    padding: "80px 20px",
    textAlign: "center",
    backgroundColor: "#fff",
  },

  sectionTitle: {
    fontSize: "32px",
    marginBottom: "30px",
  },

  sectionText: {
    maxWidth: "750px",
    margin: "0 auto 20px",
    fontSize: "18px",
  },

  cardContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "25px",
    flexWrap: "wrap",
    marginTop: "40px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "15px",
    width: "260px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
  },
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 40px",
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 20px rgba(198,40,40,0.15)",
  },

  navLeft: {
    display: "flex",
    alignItems: "center",
  },

  navLogo: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#c62828",
    letterSpacing: "1px",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  /* default nav buttons */
  navLinksButton: {
    background: "transparent",
    border: "none",
    fontSize: "15px",
    fontWeight: "600",
    color: "#b71c1c",
    cursor: "pointer",
  },

  navLogin: {
    padding: "8px 18px",
    backgroundColor: "#c62828",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 5px 12px rgba(198,40,40,0.4)",
  },

  navAbout: {
    padding: "8px 16px",
    background: "transparent",
    color: "#c62828",
    border: "2px solid #c62828",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },

};

export default LandingPage;
