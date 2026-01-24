import { useState, useEffect } from "react";
import { API_URL } from "../../src/lib/env";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalPatients: 0,
    totalHospitals: 0,
    totalRequests: 0,
    pendingRequests: 0,
    fulfilledRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [donorsRes, patientsRes, hospitalsRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/donors`).catch(() => ({ json: () => [] })),
        fetch(`${API_URL}/api/admin/patients`).catch(() => ({ json: () => [] })),
        fetch(`${API_URL}/api/hospitals`),
        fetch(`${API_URL}/api/requests`),
      ]);

      const donors = await donorsRes.json();
      const patients = await patientsRes.json();
      const hospitals = await hospitalsRes.json();
      const requests = await requestsRes.json();

      setStats({
        totalDonors: donors.length || 0,
        totalPatients: patients.length || 0,
        totalHospitals: hospitals.length || 0,
        totalRequests: requests.length || 0,
        pendingRequests: requests.filter((r) => r.status === "pending").length,
        fulfilledRequests: requests.filter((r) => r.status === "fulfilled").length,
      });

      setRecentRequests(requests.slice(0, 10));
    } catch (err) {
      console.error(err);
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Donors</div>
          <div className="text-3xl font-bold">{stats.totalDonors}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Patients</div>
          <div className="text-3xl font-bold">{stats.totalPatients}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Hospitals</div>
          <div className="text-3xl font-bold">{stats.totalHospitals}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Total Requests</div>
          <div className="text-3xl font-bold">{stats.totalRequests}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Pending</div>
          <div className="text-3xl font-bold">{stats.pendingRequests}</div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Fulfilled</div>
          <div className="text-3xl font-bold">{stats.fulfilledRequests}</div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Blood Requests</h3>
        {recentRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Blood Group</th>
                  <th className="px-6 py-4 text-left font-semibold">Component</th>
                  <th className="px-6 py-4 text-left font-semibold">Units</th>
                  <th className="px-6 py-4 text-left font-semibold">Hospital</th>
                  <th className="px-6 py-4 text-left font-semibold">Urgency</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">#{request.id}</td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-red-600">{request.blood_group}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{request.component}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {request.units_fulfilled || 0} / {request.units_required}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {request.hospitals?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          request.urgency === "Emergency"
                            ? "bg-red-100 text-red-700"
                            : request.urgency === "Urgent"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {request.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          request.status === "fulfilled"
                            ? "bg-green-100 text-green-700"
                            : request.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {request.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
