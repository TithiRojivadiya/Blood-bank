import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    reg_id: "",
    contact_person: "",
  });

  useEffect(() => {
    if (!user?.id || user?.role !== "HOSPITAL") {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/api/profile?role=HOSPITAL&id=${user.id}`)
      .then((r) => r.json())
      .then((d) =>
        setProfileData({
          name: d.name ?? "",
          email: d.email ?? "",
          phone: d.phone ?? "",
          city: d.city ?? "",
          reg_id: d.reg_id ?? "",
          contact_person: d.contact_person ?? "",
        })
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  const handleChange = (e) => setProfileData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = () => {
    fetch(`${API_URL}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "HOSPITAL",
        id: user.id,
        name: profileData.name,
        phone: profileData.phone,
        city: profileData.city,
        reg_id: profileData.reg_id || null,
        contact_person: profileData.contact_person,
      }),
    })
      .then((r) => r.json())
      .then(() => { alert("Profile updated."); setEditable(false); })
      .catch(() => alert("Failed to update."));
  };

  if (loading) return <p className="p-6 text-gray-500">Loading profile…</p>;
  if (!user?.id) return <p className="p-6 text-gray-500">Log in to view profile.</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl border-2 border-red-500">
      <h2 className="text-2xl font-bold text-red-600 mb-6 text-center">Profile</h2>
      {["name", "email", "phone", "city", "reg_id", "contact_person"].map((key) => (
        <div key={key} className="mb-4">
          <label className="block text-red-700 font-semibold mb-1">
            {key === "name" ? "Hospital / Blood Bank Name" : key === "reg_id" ? "Registration ID" : key === "contact_person" ? "Contact Person" : key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
          <input
            type={key === "email" ? "email" : "text"}
            name={key}
            value={profileData[key] ?? ""}
            onChange={handleChange}
            disabled={!editable || key === "email"}
            readOnly={key === "email"}
            className={`w-full p-2 border ${editable && key !== "email" ? "border-red-500" : "border-gray-300"} rounded`}
          />
        </div>
      ))}
      <div className="text-center">
        <button
          onClick={editable ? handleSave : () => setEditable(true)}
          className="px-6 py-2 font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          {editable ? "Save" : "Edit"}
        </button>
      </div>
    </div>
  );
}

export default Profile;
