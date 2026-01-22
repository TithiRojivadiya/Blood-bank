import { useState } from "react";
import { Link } from "react-router";

// phone no. : First digit must be 6, 7, 8, or 9

const roles = ["Patient", "Donor", "Hospital", "Admin"];

const Signup = () => {
  const [role, setRole] = useState("Patient");
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

    // Allow only numbers in phone field
    if (name === "phone" && !/^\d*$/.test(value)) return;

    setForm({ ...form, [name]: value });
  };

  // Validations
  const isEmailValid = /\S+@\S+\.\S+/.test(form.email);
  const isPasswordValid = form.password.length >= 6;
  const isPhoneValid = /^[6-9]\d{9}$/.test(form.phone);

  const isFormValid = () => {
    if (role === "Patient")
      return (
        form.fullName &&
        isEmailValid &&
        isPhoneValid &&
        isPasswordValid &&
        form.city
      );

    if (role === "Donor")
      return (
        form.fullName &&
        isEmailValid &&
        isPhoneValid &&
        isPasswordValid &&
        form.city &&
        form.bloodGroup &&
        form.age
      );

    if (role === "Hospital")
      return (
        form.hospitalName &&
        isEmailValid &&
        isPhoneValid &&
        isPasswordValid &&
        form.city &&
        form.contactPerson
      );

    if (role === "Admin")
      return form.adminName && isEmailValid && isPasswordValid;

    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-red-600">
          Join the Life Saver Network 
        </h1>
        <p className="text-center text-gray-500 mt-1">
          Create your account to help or receive help
        </p>

        {/* Role Selection */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`py-2 rounded-lg text-sm font-semibold transition ${
                role === r
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="mt-6 space-y-4">
          {/* Patient */}
          {role === "Patient" && (
            <>
              <Input name="fullName" placeholder="Full Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />

              <Input
                name="phone"
                placeholder="Phone Number (10 digits)"
                maxLength={10}
                onChange={handleChange}
              />
              {form.phone && !isPhoneValid && (
                <p className="text-sm text-red-500">
                  Enter a valid 10-digit mobile number
                </p>
              )}

              <Input name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} />
              <Input name="city" placeholder="City / Area" onChange={handleChange} />
            </>
          )}

          {/* Donor */}
          {role === "Donor" && (
            <>
              <Input name="fullName" placeholder="Full Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />

              <Input
                name="phone"
                placeholder="Phone Number (10 digits)"
                maxLength={10}
                onChange={handleChange}
              />
              {form.phone && !isPhoneValid && (
                <p className="text-sm text-red-500">
                  Enter a valid 10-digit mobile number
                </p>
              )}

              <Input name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} />
              <Input name="bloodGroup" placeholder="Blood Group (e.g. O+)" onChange={handleChange} />
              <Input name="city" placeholder="City / Area" onChange={handleChange} />
              <Input name="age" type="number" placeholder="Age" onChange={handleChange} />
              <Input name="lastDonation" type="date" />

              {/* Availability */}
              <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                <span className="font-medium text-red-600">Availability</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, availability: !form.availability })
                  }
                  className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    form.availability
                      ? "bg-green-500 text-white"
                      : "bg-gray-400 text-white"
                  }`}
                >
                  {form.availability ? "Available" : "Not Available"}
                </button>
              </div>
            </>
          )}

          {/* Hospital */}
          {role === "Hospital" && (
            <>
              <Input name="hospitalName" placeholder="Hospital / Blood Bank Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />

              <Input
                name="phone"
                placeholder="Phone Number (10 digits)"
                maxLength={10}
                onChange={handleChange}
              />
              {form.phone && !isPhoneValid && (
                <p className="text-sm text-red-500">
                  Enter a valid 10-digit mobile number
                </p>
              )}

              <Input name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} />
              <Input name="city" placeholder="City / Area" onChange={handleChange} />
              <Input name="regId" placeholder="Registration ID (optional)" />
              <Input name="contactPerson" placeholder="Contact Person Name" onChange={handleChange} />
            </>
          )}

          {/* Admin */}
          {role === "Admin" && (
            <>
              <Input name="adminName" placeholder="Admin Name" onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" onChange={handleChange} />
              <Input name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} />
            </>
          )}
        </div>

        {/* Submit */}
        <button
          disabled={!isFormValid()}
          className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
            isFormValid()
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Sign Up
        </button>

        {/* Login */}
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/" className="text-red-600 font-semibold hover:underline">
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
    required
    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
    {...props}
  />
);

export default Signup;
