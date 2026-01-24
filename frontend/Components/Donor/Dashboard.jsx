import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";
import { Link } from "react-router";

const Dashboard = () => {
  const { user, recipientKey } = useContext(AuthContext);
  const [activeRequests, setActiveRequests] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [stats, setStats] = useState({ totalDonations: 0, activeRequests: 0, lastDonation: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [responsesRes, donationsRes] = await Promise.all([
        fetch(`${API_URL}/api/donor-responses/donor/${user.id}`),
        fetch(`${API_URL}/api/donations/donor/${user.id}`),
      ]);

      const responses = await responsesRes.json();
      const donations = await donationsRes.json();

      const pending = responses.filter((r) => r.response === "pending" && r.blood_requests?.status === "pending");
      setActiveRequests(pending);
      setDonationHistory(donations.slice(0, 5));
      setStats({
        totalDonations: donations.length,
        activeRequests: pending.length,
        lastDonation: donations[0]?.donation_date || null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, response) => {
    try {
      await fetch(`${API_URL}/api/donor-responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          donor_id: user.id,
          response,
        }),
      });
      fetchData();
    } catch (err) {
      alert("Failed to submit response");
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Donor Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Total Donations</div>
          <div className="text-4xl font-bold">{stats.totalDonations}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Active Requests</div>
          <div className="text-4xl font-bold">{stats.activeRequests}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="text-sm opacity-90 mb-2">Last Donation</div>
          <div className="text-2xl font-bold">
            {stats.lastDonation ? new Date(stats.lastDonation).toLocaleDateString() : "Never"}
          </div>
        </div>
      </div>

      {/* Active Requests */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Active Blood Requests</h3>
          <Link to="/donor/notification" className="text-red-600 hover:text-red-800 font-medium">
            View All Notifications →
          </Link>
        </div>
        {activeRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active requests at the moment.</p>
        ) : (
          <div className="space-y-4">
            {activeRequests.map((item) => {
              const request = item.blood_requests;
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-red-600">{request?.blood_group}</span>
                        <span className="text-gray-700">{request?.component}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            request?.urgency === "Emergency"
                              ? "bg-red-100 text-red-700"
                              : request?.urgency === "Urgent"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {request?.urgency}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{request?.reason}</p>
                      <p className="text-sm text-gray-500">
                        {request?.hospitals?.name} • {request?.hospitals?.city} • {request?.units_required} units
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleResponse(request?.id, "accepted")}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleResponse(request?.id, "declined")}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition text-sm font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Donations */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Donations</h3>
        {donationHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No donation history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Blood Group</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Component</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Units</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hospital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donationHistory.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(donation.donation_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{donation.blood_group}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{donation.component}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{donation.units}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {donation.hospitals?.name || "N/A"}
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
