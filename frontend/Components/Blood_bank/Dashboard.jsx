import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";
import { Link } from "react-router";
import { usePageTitle } from "../../src/hooks/usePageTitle";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  usePageTitle();
  const [requests, setRequests] = useState([]);
  const [inventorySummary, setInventorySummary] = useState({});
  const [stats, setStats] = useState({ pending: 0, fulfilled: 0, totalUnits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/requests?hospital_id=${user.id}`),
        fetch(`${API_URL}/api/inventory/${user.id}/summary`),
      ]);

      const requestsJson = await requestsRes.json().catch(() => ({}));
      const summaryData = await summaryRes.json().catch(() => ({}));

      const requestsList = Array.isArray(requestsJson)
        ? requestsJson
        : (requestsJson?.data ?? []);
      const requestsArray = Array.isArray(requestsList) ? requestsList : [];
      setRequests(requestsArray.slice(0, 3)); // Show only top 3
      setInventorySummary(typeof summaryData === "object" && summaryData !== null ? summaryData : {});

      const totalUnits = Object.values(summaryData).reduce(
        (sum, bg) => sum + (bg?.total ?? 0),
        0
      );

      setStats({
        pending: requestsArray.filter((r) => r?.status === "pending").length,
        fulfilled: requestsArray.filter((r) => r?.status === "fulfilled").length,
        totalUnits,
      });
    } catch (err) {
      console.error(err);
      setRequests([]);
      setInventorySummary({});
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

  if (!user?.id) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🩸</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Please log in</h3>
          <p className="text-gray-600 mb-6">Sign in as a hospital or blood bank to manage inventory and requests.</p>
          <Link
            to="/login"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Blood Bank Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Total Inventory</div>
          <div className="text-4xl font-bold">{stats.totalUnits}</div>
          <div className="text-sm opacity-75 mt-2">units available</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Pending Requests</div>
          <div className="text-4xl font-bold">{stats.pending}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Fulfilled</div>
          <div className="text-4xl font-bold">{stats.fulfilled}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Quick Actions</div>
          <Link
            to="/blood-bank/inventory"
            className="text-sm underline opacity-90 hover:opacity-100"
          >
            Manage Inventory →
          </Link>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Inventory by Blood Group</h3>
          <Link to="/blood-bank/inventory" className="text-red-600 hover:text-red-800 font-medium">
            View Full Inventory →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => {
            const total = inventorySummary[bg]?.total || 0;
            return (
              <div
                key={bg}
                className={`border-2 rounded-lg p-4 text-center ${
                  total === 0
                    ? "border-red-300 bg-red-50"
                    : total < 5
                    ? "border-orange-300 bg-orange-50"
                    : "border-green-300 bg-green-50"
                }`}
              >
                <div className="text-lg font-bold text-gray-800 mb-1">{bg}</div>
                <div className="text-2xl font-bold text-gray-800">{total}</div>
                <div className="text-xs text-gray-600">units</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Recent Requests</h3>
          <Link to="/blood-bank/history" className="text-red-600 hover:text-red-800 font-medium text-sm">
            View All History →
          </Link>
        </div>
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Blood Group</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Component</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Units</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Urgency</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-red-600">{request.blood_group}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{request.component}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {request.units_fulfilled || 0} / {request.units_required}
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-sm text-gray-500">
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
