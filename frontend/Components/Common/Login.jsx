import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router";
import AuthContext from "../../src/Context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-white to-red-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-red-600">
            Welcome Back 
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Login to help save lives through blood donation
          </p>
        </div>

        {err && <p className="text-red-600 text-sm mb-2">{err}</p>}
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-600">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
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
            className={`w-full py-2.5 rounded-lg font-semibold text-lg transition duration-200 shadow-md
              ${
                isValid
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {loading ? "Signing in…" : "Login Securely"}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          No account?{" "}
          <Link
            to="/signup"
            className="text-red-600 font-semibold hover:underline"
          >
            Create one
          </Link>
        </p>

        <p className="text-center text-xs text-gray-500 mt-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700">← Back to home</Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-3">
          Demo: Hospital / Blood Bank uses password <code className="bg-gray-100 px-1 rounded">changeme</code>
        </p>
      </div>
    </div>
  );
};

export default Login;
