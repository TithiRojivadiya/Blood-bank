import { useState, useEffect } from "react";
import { API_URL } from "../../src/lib/env";

const Users = () => {
  const [users, setUsers] = useState({ patients: [], donors: [], hospitals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("patients");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const [patientsRes, donorsRes, hospitalsRes] = await Promise.all([
        fetch(`${API_URL}/api/profile?role=PATIENT`).catch(() => ({ json: () => [] })),
        fetch(`${API_URL}/api/profile?role=DONOR`).catch(() => ({ json: () => [] })),
        fetch(`${API_URL}/api/profile?role=HOSPITAL`).catch(() => ({ json: () => [] })),
      ]);

      const patients = await patientsRes.json().catch(() => []);
      const donors = await donorsRes.json().catch(() => []);
      const hospitals = await hospitalsRes.json().catch(() => []);

      setUsers({
        patients: Array.isArray(patients) ? patients : [],
        donors: Array.isArray(donors) ? donors : [],
        hospitals: Array.isArray(hospitals) ? hospitals : [],
      });
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data, type) => {
    if (type === "patients") {
      return (
        <table className="w-full">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{user.full_name || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.email || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.city || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (type === "donors") {
      return (
        <table className="w-full">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Blood Group</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{user.full_name || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.email || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.phone || "—"}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-red-600">{user.blood_group || "—"}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">{user.city || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.is_available ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (type === "hospitals") {
      return (
        <table className="w-full">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold">Contact Person</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{user.name || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.email || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.city || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{user.contact_person || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Users</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("patients")}
              className={`px-6 py-3 font-medium ${
                activeTab === "patients"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Patients ({users.patients.length})
            </button>
            <button
              onClick={() => setActiveTab("donors")}
              className={`px-6 py-3 font-medium ${
                activeTab === "donors"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Donors ({users.donors.length})
            </button>
            <button
              onClick={() => setActiveTab("hospitals")}
              className={`px-6 py-3 font-medium ${
                activeTab === "hospitals"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Hospitals ({users.hospitals.length})
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {activeTab === "patients" && users.patients.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No patients found.</p>
          ) : activeTab === "donors" && users.donors.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No donors found.</p>
          ) : activeTab === "hospitals" && users.hospitals.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No hospitals found.</p>
          ) : (
            renderTable(users[activeTab], activeTab)
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
