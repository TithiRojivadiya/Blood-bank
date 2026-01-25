import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router";
import AuthContext from "../../src/Context/AuthContext";
import { API_URL } from "../../src/lib/env";
import { usePageTitle } from "../../src/hooks/usePageTitle";

const roles = ["Patient", "Donor", "Hospital"];

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useContext(AuthContext);
  usePageTitle();

  const [role, setLocalRole] = useState("Patient");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    bloodGroup: "",
    age: "",
    lastDonation: "",
    availability: true,
    hospitalName: "",
    regId: "",
    contactPerson: "",
    latitude: null,
    longitude: null,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setForm((f) => ({ ...f, latitude: p.coords.latitude, longitude: p.coords.longitude })),
      () => alert("Could not get location")
    );
  };

  // Robust email validation
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Check if email exists
  const checkEmailExists = async (email) => {
    if (!validateEmail(email)) return false;
    setEmailChecking(true);
    try {
      // We'll check on backend, but we can show loading state
      return false;
    } finally {
      setEmailChecking(false);
    }
  };

  // Validate real number
  const validateNumber = (value, min = 0, max = Infinity) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max && Number.isFinite(num);
  };

  // Validations
  const isEmailValid = validateEmail(form.email);
  const isPasswordValid = form.password.length >= 6;
  const isPhoneValid = /^[6-9]\d{9}$/.test(form.phone);
  const isAgeValid = !form.age || validateNumber(form.age, 1, 120);

  const isFormValid = () => {
    if (role === "Patient")
      return form.fullName && isEmailValid && isPhoneValid && isPasswordValid && form.city;

    if (role === "Donor")
      return form.fullName && isEmailValid && isPhoneValid && isPasswordValid &&
             form.city && form.bloodGroup && form.age && isAgeValid;

    if (role === "Hospital")
      return form.hospitalName && isEmailValid && isPhoneValid &&
             isPasswordValid && form.city && form.contactPerson;

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setValidationErrors({});

    // Client-side validation
    const errors = {};
    if (!form.fullName || form.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    }
    if (!isEmailValid) {
      errors.email = "Please enter a valid email address";
    }
    if (!isPhoneValid) {
      errors.phone = "Phone must be 10 digits starting with 6, 7, 8, or 9";
    }
    if (!isPasswordValid) {
      errors.password = "Password must be at least 6 characters";
    }
    if (role === "Donor" && (!form.age || !isAgeValid)) {
      errors.age = "Age must be between 1 and 120";
    }
    if (role === "Donor" && !form.bloodGroup) {
      errors.bloodGroup = "Blood group is required";
    }
    if (role === "Hospital" && !form.hospitalName) {
      errors.hospitalName = "Hospital name is required";
    }
    if (role === "Hospital" && !form.contactPerson) {
      errors.contactPerson = "Contact person is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!isFormValid()) return;
    
    setLoading(true);
    try {
      const body = { ...form };
      if (role === "Donor" || role === "Hospital") {
        body.latitude = form.latitude != null ? form.latitude : null;
        body.longitude = form.longitude != null ? form.longitude : null;
      }
      await signup(role.toUpperCase(), body);
      if (role === "Patient") navigate("/patient/dashboard");
      else if (role === "Donor") navigate("/donor/dashboard");
      else if (role === "Hospital") navigate("/blood-bank/dashboard");
      else navigate("/");
    } catch (e) {
      setErr(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-red-100 px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
            <span className="text-4xl">🩸</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Join the Life Saver Network
          </h1>
          <p className="text-gray-600">Create your account and help save lives</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setLocalRole(r);
                setValidationErrors({});
                setErr("");
              }}
              className={`py-4 px-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-200 ${
                role === r
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {role === "Patient" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <Input 
                  name="fullName" 
                  placeholder="Enter your full name" 
                  value={form.fullName}
                  onChange={handleChange}
                  error={validationErrors.fullName}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="example@email.com" 
                  value={form.email}
                  onChange={handleChange}
                  error={validationErrors.email}
                />
                {emailChecking && <p className="text-xs text-blue-600 mt-1">Checking email...</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <Input 
                  name="phone" 
                  placeholder="10-digit mobile number" 
                  maxLength={10}
                  value={form.phone}
                  onChange={handleChange}
                  error={validationErrors.phone || (!isPhoneValid && form.phone ? "Phone must be 10 digits starting with 6, 7, 8, or 9" : "")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <Input 
                  name="password" 
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={form.password}
                  onChange={handleChange}
                  error={validationErrors.password || (!isPasswordValid && form.password ? "Password must be at least 6 characters" : "")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                <Input 
                  name="city" 
                  placeholder="Enter your city" 
                  value={form.city}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {role === "Donor" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <Input 
                  name="fullName" 
                  placeholder="Enter your full name" 
                  value={form.fullName}
                  onChange={handleChange}
                  error={validationErrors.fullName}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="example@email.com" 
                  value={form.email}
                  onChange={handleChange}
                  error={validationErrors.email}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <Input 
                  name="phone" 
                  placeholder="10-digit mobile number" 
                  maxLength={10}
                  value={form.phone}
                  onChange={handleChange}
                  error={validationErrors.phone || (!isPhoneValid && form.phone ? "Phone must be 10 digits starting with 6, 7, 8, or 9" : "")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <Input 
                  name="password" 
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={form.password}
                  onChange={handleChange}
                  error={validationErrors.password || (!isPasswordValid && form.password ? "Password must be at least 6 characters" : "")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group *</label>
                <select 
                  name="bloodGroup" 
                  value={form.bloodGroup} 
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
                    validationErrors.bloodGroup ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Blood Group</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
                {validationErrors.bloodGroup && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.bloodGroup}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                <Input 
                  name="city" 
                  placeholder="Enter your city" 
                  value={form.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                <Input 
                  name="age" 
                  type="number" 
                  placeholder="Enter your age (1-120)" 
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  error={validationErrors.age || (!isAgeValid && form.age ? "Age must be between 1 and 120" : "")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Donation Date (Optional)</label>
                <Input 
                  name="lastDonation" 
                  type="date" 
                  value={form.lastDonation}
                  onChange={handleChange}
                />
              </div>
              <div>
                <button 
                  type="button" 
                  onClick={handleUseLocation} 
                  className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline flex items-center gap-2"
                >
                  <span>📍</span> Use my location (for 5km matching)
                </button>
                {form.latitude != null && (
                  <span className="ml-2 text-xs text-green-600 font-medium">
                    ✓ Location captured: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                  </span>
                )}
              </div>
            </>
          )}

          {role === "Hospital" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital Name *</label>
                <Input 
                  name="hospitalName" 
                  placeholder="Enter hospital name" 
                  value={form.hospitalName}
                  onChange={handleChange}
                  error={validationErrors.hospitalName}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="hospital@example.com" 
                  value={form.email}
                  onChange={handleChange}
                  error={validationErrors.email}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <Input 
                  name="phone" 
                  placeholder="10-digit mobile number" 
                  maxLength={10}
                  value={form.phone}
                  onChange={handleChange}
                  error={validationErrors.phone || (!isPhoneValid && form.phone ? "Phone must be 10 digits starting with 6, 7, 8, or 9" : "")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <Input 
                  name="password" 
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={form.password}
                  onChange={handleChange}
                  error={validationErrors.password || (!isPasswordValid && form.password ? "Password must be at least 6 characters" : "")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                <Input 
                  name="city" 
                  placeholder="Enter city" 
                  value={form.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Registration ID (Optional)</label>
                <Input 
                  name="regId" 
                  placeholder="Hospital registration ID" 
                  value={form.regId}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person *</label>
                <Input 
                  name="contactPerson" 
                  placeholder="Contact person name" 
                  value={form.contactPerson}
                  onChange={handleChange}
                  error={validationErrors.contactPerson}
                />
              </div>
              <div>
                <button 
                  type="button" 
                  onClick={handleUseLocation} 
                  className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline flex items-center gap-2"
                >
                  <span>📍</span> Use my location (for 5km donor matching)
                </button>
                {form.latitude != null && (
                  <span className="ml-2 text-xs text-green-600 font-medium">
                    ✓ Location captured: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                  </span>
                )}
              </div>
            </>
          )}

          {err && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
              <p className="font-semibold">Error</p>
              <p>{err}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isFormValid() && !loading
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Signing up...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="text-red-600 font-semibold hover:text-red-700 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

const Input = ({ type = "text", error, ...props }) => (
  <div>
    <input
      type={type}
      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
        error ? "border-red-500" : "border-gray-300"
      }`}
      {...props}
    />
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

export default Signup;
