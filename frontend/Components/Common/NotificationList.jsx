import { useState, useEffect, useContext } from "react";
import AuthContext from "../../src/Context/AuthContext";
import { API_URL } from "../../src/lib/env";
import { supabase } from "../../src/lib/supabase";

export default function NotificationList() {
  const { recipientKey, user } = useContext(AuthContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState({}); // id -> true while fetching

  const fetchList = () => {
    if (!recipientKey) {
      setList([]);
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/notifications/${encodeURIComponent(recipientKey)}`)
      .then((r) => r.json())
      .then((json) => {
        const arr = Array.isArray(json) ? json : (json?.data ?? []);
        setList(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [recipientKey]);

  // Real-time: subscribe to new notifications for this recipient
  useEffect(() => {
    if (!recipientKey || !supabase) return;
    const ch = supabase
      .channel(`notif-${recipientKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_key=eq.${recipientKey}` },
        () => fetchList()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [recipientKey]);

  const markRead = (id) => {
    fetch(`${API_URL}/api/notifications/${id}/read`, { method: "PATCH" })
      .then(() => setList((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))));
  };

  // Donor: Donate button - automatically assigns nearest hospital
  const handleDonate = async (requestId, notificationId) => {
    if (!user?.id || user?.role !== "DONOR") return;
    setResponding((s) => ({ ...s, [requestId]: true }));
    try {
      // Get request details
      const reqRes = await fetch(`${API_URL}/api/requests/${requestId}`);
      const requestData = await reqRes.json().catch(() => ({}));
      if (!reqRes.ok) throw new Error("Failed to get request details");

      // Find nearest hospital to donor
      const hospitalRes = await fetch(`${API_URL}/api/donations/nearest-hospital/${user.id}`);
      const hospitalData = await hospitalRes.json().catch(() => ({}));
      if (!hospitalRes.ok || !hospitalData) {
        throw new Error(hospitalData?.error || "No hospital found within 50km. Please update your location.");
      }

      // Create donor response
      const res = await fetch(`${API_URL}/api/donor-responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          donor_id: user.id,
          response: "accepted",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create donor response");

      // Update inventory (add 1 unit using adjust endpoint)
      const invRes = await fetch(`${API_URL}/api/inventory/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_id: hospitalData.id,
          blood_group: requestData.blood_group,
          component: requestData.component,
          units_change: 1,
          operation: "add",
        }),
      });
      if (!invRes.ok) console.warn("Failed to update inventory");

      // Notify hospital
      await fetch(`${API_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_key: `hospital_${hospitalData.id}`,
          title: "🩸 Donor Ready to Donate",
          body: `Donor ${user.full_name || user.email} is ready to donate ${requestData.blood_group} ${requestData.component} for request #${requestId}.`,
          request_id: requestId,
        }),
      }).catch(() => {});

      // Notify patient
      await fetch(`${API_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_key: requestData.patient_id ? `patient_${requestData.patient_id}` : null,
          title: "✅ Blood Available",
          body: `A donor is ready to donate. Blood will be available at ${hospitalData.name}. Please contact the hospital.`,
          request_id: requestId,
        }),
      }).catch(() => {});

      // Mark notification as read
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, { method: "PATCH" });
      setList((prev) => prev.map((nn) => (nn.id === notificationId ? { ...nn, read_at: new Date().toISOString(), _donorResponded: "Donated" } : nn)));
    } catch (e) {
      alert(e.message || "Failed to process donation");
    } finally {
      setResponding((s) => ({ ...s, [requestId]: false }));
    }
  };

  const isDonorRequest = (n) => user?.role === "DONOR" && n.request_id && !n._donorResponded;

  if (!recipientKey) {
    return <p className="text-gray-600">Log in to see your notifications.</p>;
  }
  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (list.length === 0) return <p className="text-gray-500">No notifications yet.</p>;

  return (
    <div className="space-y-4">
        {list.map((n) => (
        <div
          key={n.id}
          className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
            n.read_at || n._donorResponded
              ? "bg-white border-gray-200 opacity-75"
              : "bg-gradient-to-r from-red-50 to-pink-50 border-red-300 shadow-md"
          }`}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className={`font-bold text-lg ${n.read_at || n._donorResponded ? "text-gray-700" : "text-red-700"}`}>
                  {n.title}
                </h4>
                {!n.read_at && !n._donorResponded && (
                  <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">NEW</span>
                )}
                {n._donorResponded && (
                  <span className="px-2 py-0.5 bg-gray-500 text-white text-xs font-semibold rounded-full">
                    {n._donorResponded}
                  </span>
                )}
              </div>
              <p className={`text-sm mt-2 ${n.read_at || n._donorResponded ? "text-gray-600" : "text-gray-800"}`}>
                {n.body}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-xs text-gray-500">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</p>
                {n.request_id && (
                  <span className="text-xs text-blue-600 font-medium">Request #{n.request_id}</span>
                )}
              </div>
            </div>
            {!n.read_at && !n._donorResponded && (
              isDonorRequest(n) ? (
                <button
                  type="button"
                  disabled={responding[n.request_id]}
                  onClick={() => handleDonate(n.request_id, n.id)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition whitespace-nowrap disabled:opacity-50"
                >
                  {responding[n.request_id] ? "Processing..." : "Donate"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition whitespace-nowrap"
                >
                  Mark Read
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
