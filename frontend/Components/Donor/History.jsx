import { useState, useEffect, useContext } from "react";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";

const DonorHistory = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ responses: [], donations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetch(`${API_URL}/api/history?role=DONOR&id=${user.id}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || "Failed to load history");
        setData({ responses: d?.responses || [], donations: d?.donations || [] });
      })
      .catch((e) => {
        setData({ responses: [], donations: [] });
        setError(e?.message || "Failed to load history");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const responses = data.responses || [];
  const donations = data.donations || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Donor History</h2>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Request responses */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Request Responses</h3>
        {responses.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No request responses yet.</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Blood</th>
                    <th className="px-4 py-3 text-left font-semibold">Component</th>
                    <th className="px-4 py-3 text-left font-semibold">Hospital</th>
                    <th className="px-4 py-3 text-left font-semibold">Response</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {responses.map((x) => {
                    const req = x.blood_requests;
                    return (
                      <tr key={x.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-red-600">{req?.blood_group || "—"}</td>
                        <td className="px-4 py-3">{req?.component || "—"}</td>
                        <td className="px-4 py-3">{(req?.hospitals && req.hospitals.name) || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${x.response === "accepted" ? "bg-green-100 text-green-700" : x.response === "declined" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                            {x.response}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(x.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Donations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Donations</h3>
        {donations.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No donations recorded yet.</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Blood</th>
                    <th className="px-4 py-3 text-left font-semibold">Component</th>
                    <th className="px-4 py-3 text-left font-semibold">Units</th>
                    <th className="px-4 py-3 text-left font-semibold">Hospital</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-red-600">{d.blood_group}</td>
                      <td className="px-4 py-3">{d.component}</td>
                      <td className="px-4 py-3">{d.units}</td>
                      <td className="px-4 py-3">{(d.hospitals && d.hospitals.name) || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(d.donation_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorHistory;
