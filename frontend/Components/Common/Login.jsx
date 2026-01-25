import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router";
import AuthContext from "../../src/Context/AuthContext";
import { API_URL } from "../../src/lib/env";
import { usePageTitle } from "../../src/hooks/usePageTitle";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  // Set page title immediately
  useEffect(() => {
    document.title = 'Login - Blood Donation System';
  }, []);
  
  usePageTitle(); // This also sets the title based on route
  
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [formData, setFormData] = useState({
    role: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Validation logic
  const validate = () => {
    let newErrors = {};

    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  useEffect(() => {
    validate();
    // eslint-disable-next-line
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setErr("");
    setLoading(true);
    try {
      await login(formData.role, formData.email, formData.password);
      const role = String(formData.role || "").toUpperCase();
      if (role === "ADMIN") navigate("/admin/dashboard", { replace: true });
      else if (role === "DONOR") navigate("/donor/dashboard", { replace: true });
      else if (role === "PATIENT") navigate("/patient/dashboard", { replace: true });
      else if (role === "HOSPITAL") navigate("/blood-bank/dashboard", { replace: true });
      else navigate("/", { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!formData.role) {
      setErr("Please select a role before using Google login");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      // Redirect to Google OAuth
      const googleAuthUrl = `${API_URL}/api/auth/google?role=${formData.role}`;
      window.location.href = googleAuthUrl;
    } catch (e) {
      setErr(e.message || "Google login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-red-100 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
            <span className="text-4xl">🩸</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-sm">
            Login to help save lives through blood donation
          </p>
        </div>

        {err && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{err}</p>
          </div>
        )}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || !formData.role}
          className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md mb-6 ${
            formData.role && !loading
              ? "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              : "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role <span className="text-red-600">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full rounded-xl border-2 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
                errors.role ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">-- Select Role --</option>
              <option value="PATIENT">Patient</option>
              <option value="DONOR">Donor</option>
              <option value="HOSPITAL">Hospital / Blood Bank</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-xl border-2 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-xl border-2 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
              isValid && !loading
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Signing in...
              </span>
            ) : (
              "Login Securely"
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-red-600 font-semibold hover:text-red-700 hover:underline"
          >
            Sign up here
          </Link>
        </p>

        <p className="text-center text-xs text-gray-500 mt-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
