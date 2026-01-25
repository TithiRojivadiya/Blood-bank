import { useState, useEffect } from "react";
import { API_URL } from "../../src/lib/env";

const Donors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/api/profile?role=DONOR`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch donors");
      setDonors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load donors");
      setDonors([]);
    } finally {
      setLoading(false);
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Donors</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {donors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500">No donors found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Blood Group</th>
                  <th className="px-4 py-3 text-left font-semibold">City</th>
                  <th className="px-4 py-3 text-left font-semibold">Age</th>
                  <th className="px-4 py-3 text-left font-semibold">Available</th>
                  <th className="px-4 py-3 text-left font-semibold">Last Donation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{donor.full_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{donor.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{donor.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-red-600">{donor.blood_group || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{donor.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{donor.age || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          donor.is_available
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {donor.is_available ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {donor.last_donation_date
                        ? new Date(donor.last_donation_date).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors;
