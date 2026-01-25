import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";

const getStatusBadge = (status) => {
  const s = {
    pending: "bg-yellow-100 text-yellow-700",
    fulfilled: "bg-green-100 text-green-700",
    partially_fulfilled: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s[status] || "bg-gray-100 text-gray-700"}`}>{String(status || "").replace("_", " ")}</span>;
};

const BloodBankHistory = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ requests: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/history?role=HOSPITAL&id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setData({ requests: d?.requests || [] }))
      .catch(() => setData({ requests: [] }))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const list = data.requests || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Request History</h2>
      {list.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500">No request history yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Blood</th>
                  <th className="px-4 py-3 text-left font-semibold">Component</th>
                  <th className="px-4 py-3 text-left font-semibold">Units</th>
                  <th className="px-4 py-3 text-left font-semibold">Patient</th>
                  <th className="px-4 py-3 text-left font-semibold">Urgency</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-red-600">{r.blood_group}</td>
                    <td className="px-4 py-3">{r.component}</td>
                    <td className="px-4 py-3">{r.units_fulfilled ?? 0} / {r.units_required}</td>
                    <td className="px-4 py-3">{(r.patients && r.patients.full_name) || "—"}</td>
                    <td className="px-4 py-3">{r.urgency}</td>
                    <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.request_city || "—"}</td>
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

export default BloodBankHistory;
