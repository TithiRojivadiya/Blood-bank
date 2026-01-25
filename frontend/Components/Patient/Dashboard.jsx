import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";
import { Link } from "react-router";
import { usePageTitle } from "../../src/hooks/usePageTitle";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  usePageTitle();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchRequests();
  }, [user?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/requests?patient_id=${user.id}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRequests([]);
        return;
      }
      const list = Array.isArray(json) ? json : (json?.data ?? []);
      setRequests(Array.isArray(list) ? list.slice(0, 3) : []); // Show only top 3
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      fulfilled: "bg-green-100 text-green-700",
      partial: "bg-blue-100 text-blue-700",
      partially_fulfilled: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status?.replace("_", " ").toUpperCase()}
      </span>
    );
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
          <p className="text-gray-600 mb-6">Sign in as a patient to view and manage your blood requests.</p>
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">My Blood Requests</h2>
        <div className="flex gap-3">
          <Link
            to="/patient/history"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition shadow-md font-medium"
          >
            View History
          </Link>
          <Link
            to="/patient/request"
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition shadow-md font-medium"
          >
            + New Request
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total Requests</div>
          <div className="text-2xl font-bold text-gray-800">{requests.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-gray-800">
            {requests.filter((r) => r.status === "pending").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Fulfilled</div>
          <div className="text-2xl font-bold text-gray-800">
            {requests.filter((r) => r.status === "fulfilled").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Partial</div>
          <div className="text-2xl font-bold text-gray-800">
            {requests.filter((r) => r.status === "partial" || r.status === "partially_fulfilled").length}
          </div>
        </div>
      </div>

      {/* Recent Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🩸</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Requests Yet</h3>
          <p className="text-gray-600 mb-6">Create your first blood request to get started.</p>
          <Link
            to="/patient/request"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
          >
            Create Request
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Recent Requests (Top 3)</h3>
            <Link to="/patient/history" className="text-red-600 hover:text-red-800 font-medium text-sm">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600 text-white">
                <tr>
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
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="text-xl font-bold text-red-600">{request.blood_group}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{request.component}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {request.units_fulfilled || 0} / {request.units_required}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {(typeof request.hospitals === "object" && request.hospitals?.name) || "N/A"}
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
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
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

export default Dashboard;
