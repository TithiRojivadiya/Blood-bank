import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AuthContext from "../../src/Context/AuthContext";
import { useContext } from "react";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { persist } = useContext(AuthContext);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    const error = searchParams.get("error");

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (dataParam) {
      try {
        // Decode base64 in browser
        const decoded = atob(dataParam);
        const authData = JSON.parse(decoded);
        const { user, recipient_key, role } = authData;

        if (user && recipient_key) {
          persist(user, recipient_key, role);
          
          // Navigate based on role
          const roleUpper = String(role || "").toUpperCase();
          if (roleUpper === "ADMIN") navigate("/admin/dashboard", { replace: true });
          else if (roleUpper === "DONOR") navigate("/donor/dashboard", { replace: true });
          else if (roleUpper === "PATIENT") navigate("/patient/dashboard", { replace: true });
          else if (roleUpper === "HOSPITAL") navigate("/blood-bank/dashboard", { replace: true });
          else navigate("/", { replace: true });
        } else {
          navigate("/login?error=Invalid authentication data", { replace: true });
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        navigate("/login?error=Failed to process authentication", { replace: true });
      }
    } else {
      navigate("/login?error=No authentication data received", { replace: true });
    }
  }, [searchParams, navigate, persist]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
