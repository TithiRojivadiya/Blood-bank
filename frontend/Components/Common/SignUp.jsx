import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router";
import AuthContext from "../../src/Context/AuthContext";


const roles = ["Patient", "Donor", "Hospital", "Admin"];

const Signup = () => {
  const navigate = useNavigate();
  const { setRole } = useContext(AuthContext); // ✅ INSIDE component

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
    adminName: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setRole(role); // ✅ STORE ROLE GLOBALLY

    switch (role) {
      case "Patient":
        navigate("/patient/dashboard");
        break;
      case "Donor":
        navigate("/donor/dashboard");
        break;
      case "Hospital":
        navigate("/blood-bank/dashboard");
        break;
      case "Admin":
        navigate("/admin/dashboard");
        break;
      default:
        navigate("/");
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
              <Input name="bloodGroup" placeholder="Blood Group" onChange={handleChange} />
              <Input name="city" placeholder="City" onChange={handleChange} />
              <Input name="age" type="number" placeholder="Age" onChange={handleChange} />
              <Input name="lastDonation" type="date" onChange={handleChange} />
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
            </>
          )}

          {role === "Admin" && (
            <>
              <Input name="adminName" placeholder="Admin Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />
              <Input name="password" type="password" placeholder="Password" onChange={handleChange} />
            </>
          )}

          <button
            type="submit"
            disabled={!isFormValid()}
            className={`w-full py-3 rounded-lg font-semibold ${
              isFormValid()
                ? "bg-red-600 text-white"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            Sign Up
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
