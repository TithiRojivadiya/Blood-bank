import React, { useState } from "react";

const Profile = () => {
  const [editable, setEditable] = useState(false);
  const [profileData, setProfileData] = useState({
    hospitalName: "null",
    email: "null",
    phone: "null",
    city: "null",
    registrationID: "null",
    contactPerson: "null",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const toggleEdit = () => setEditable(!editable);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl border-2 border-red-500">
      <h2 className="text-2xl font-bold text-red-600 mb-6 text-center">
        Profile
      </h2>

      {/* Hospital / Blood Bank Name */}
      <div className="mb-4">
        <label className="block text-red-700 font-semibold mb-1">
          Hospital / Blood Bank Name
        </label>
        <input
          type="text"
          name="hospitalName"
          value={profileData.hospitalName}
          onChange={handleChange}
          disabled={!editable}
          className={`w-full p-2 border ${
            editable ? "border-red-500" : "border-gray-300"
          } rounded`}
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-red-700 font-semibold mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={profileData.email}
          onChange={handleChange}
          disabled={!editable}
          className={`w-full p-2 border ${
            editable ? "border-red-500" : "border-gray-300"
          } rounded`}
        />
      </div>

      {/* Phone Number */}
      <div className="mb-4">
        <label className="block text-red-700 font-semibold mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={profileData.phone}
          onChange={handleChange}
          disabled={!editable}
          placeholder="Must start with 6,7,8,9"
          className={`w-full p-2 border ${
            editable ? "border-red-500" : "border-gray-300"
          } rounded`}
        />
      </div>

      {/* City / Area */}
      <div className="mb-4">
        <label className="block text-red-700 font-semibold mb-1">
          City / Area
        </label>
        <input
          type="text"
          name="city"
          value={profileData.city}
          onChange={handleChange}
          disabled={!editable}
          className={`w-full p-2 border ${
            editable ? "border-red-500" : "border-gray-300"
          } rounded`}
        />
      </div>

      {/* Registration ID */}
      <div className="mb-4">
        <label className="block text-red-700 font-semibold mb-1">
          Registration ID
        </label>
        <input
          type="text"
          name="registrationID"
          value={profileData.registrationID}
          onChange={handleChange}
          disabled={!editable}
          className={`w-full p-2 border ${
            editable ? "border-red-500" : "border-gray-300"
          } rounded`}
        />
      </div>

      {/* Contact Person Name */}
      <div className="mb-4">
        <label className="block text-red-700 font-semibold mb-1">
          Contact Person Name
        </label>
        <input
          type="text"
          name="contactPerson"
          value={profileData.contactPerson}
          onChange={handleChange}
          disabled={!editable}
          className={`w-full p-2 border ${
            editable ? "border-red-500" : "border-gray-300"
          } rounded`}
        />
      </div>

      {/* Edit / Save Button */}
      <div className="text-center">
        <button
          onClick={toggleEdit}
          className="px-6 py-2 font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          {editable ? "Save" : "Edit"}
        </button>
      </div>
    </div>
  );
};

export default Profile;
