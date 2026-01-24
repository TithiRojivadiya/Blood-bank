import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router";
import AuthContext from "../../src/Context/AuthContext";


const roles = ["Patient", "Donor", "Hospital", "Admin"];

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useContext(AuthContext);

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
    adminName: "",
    latitude: null,
    longitude: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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

  // Validations
  const isEmailValid = /\S+@\S+\.\S+/.test(form.email);
  const isPasswordValid = form.password.length >= 6;
  const isPhoneValid = /^[6-9]\d{9}$/.test(form.phone);

  const isFormValid = () => {
    if (role === "Patient")
      return form.fullName && isEmailValid && isPhoneValid && isPasswordValid && form.city;

    if (role === "Donor")
      return form.fullName && isEmailValid && isPhoneValid && isPasswordValid &&
             form.city && form.bloodGroup && form.age;

    if (role === "Hospital")
      return form.hospitalName && isEmailValid && isPhoneValid &&
             isPasswordValid && form.city && form.contactPerson;

    if (role === "Admin")
      return form.adminName && isEmailValid && isPasswordValid;

    return false;
  };

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setErr("");
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
      else if (role === "Admin") navigate("/admin/dashboard");
      else navigate("/");
    } catch (e) {
      setErr(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-red-600">
          Join the Life Saver Network
        </h1>

        {/* Role Selection */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setLocalRole(r)}
              className={`py-2 rounded-lg font-semibold ${
                role === r
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          {role === "Patient" && (
            <>
              <Input name="fullName" placeholder="Full Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />
              <Input name="phone" placeholder="Phone Number" maxLength={10} onChange={handleChange} />
              {!isPhoneValid && form.phone && <Error />}
              <Input name="password" type="password" placeholder="Password" onChange={handleChange} />
              <Input name="city" placeholder="City" onChange={handleChange} />
            </>
          )}

          {role === "Donor" && (
            <>
              <Input name="fullName" placeholder="Full Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />
              <Input name="phone" placeholder="Phone Number" maxLength={10} onChange={handleChange} />
              {!isPhoneValid && form.phone && <Error />}
              <Input name="password" type="password" placeholder="Password" onChange={handleChange} />
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500">
                <option value="">Blood Group</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <Input name="city" placeholder="City" onChange={handleChange} />
              <Input name="age" type="number" placeholder="Age" onChange={handleChange} />
              <Input name="lastDonation" type="date" placeholder="Last donation (optional)" onChange={handleChange} />
              <div>
                <button type="button" onClick={handleUseLocation} className="text-sm text-red-600 hover:underline">Use my location (5km matching)</button>
                {form.latitude != null && <span className="ml-2 text-xs text-gray-500">✓ {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span>}
              </div>
            </>
          )}

          {role === "Hospital" && (
            <>
              <Input name="hospitalName" placeholder="Hospital Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />
              <Input name="phone" placeholder="Phone Number" maxLength={10} onChange={handleChange} />
              {!isPhoneValid && form.phone && <Error />}
              <Input name="password" type="password" placeholder="Password" onChange={handleChange} />
              <Input name="city" placeholder="City" onChange={handleChange} />
              <Input name="regId" placeholder="Registration ID" onChange={handleChange} />
              <Input name="contactPerson" placeholder="Contact Person" onChange={handleChange} />
              <div>
                <button type="button" onClick={handleUseLocation} className="text-sm text-red-600 hover:underline">Use my location (5km donor matching)</button>
                {form.latitude != null && <span className="ml-2 text-xs text-gray-500">✓ {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span>}
              </div>
            </>
          )}

          {role === "Admin" && (
            <>
              <Input name="adminName" placeholder="Admin Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />
              <Input name="password" type="password" placeholder="Password" onChange={handleChange} />
            </>
          )}

          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={`w-full py-3 rounded-lg font-semibold ${
              isFormValid() && !loading ? "bg-red-600 text-white" : "bg-gray-300 text-gray-500"
            }`}
          >
            {loading ? "Signing up…" : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/" className="text-red-600 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

const Input = ({ type = "text", ...props }) => (
  <input
    type={type}
    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
    {...props}
  />
);

const Error = () => (
  <p className="text-sm text-red-500">Enter a valid 10-digit mobile number</p>
);

export default Signup;
