import { useState, useEffect, useContext } from "react";
import AuthContext from "../../src/Context/AuthContext";
import { API_URL } from "../../src/lib/env";
import { supabase } from "../../src/lib/supabase";

export default function NotificationList() {
  const { recipientKey } = useContext(AuthContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = () => {
    if (!recipientKey) {
      setList([]);
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/notifications/${encodeURIComponent(recipientKey)}`)
      .then((r) => r.json())
      .then(setList)
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
            n.read_at
              ? "bg-white border-gray-200 opacity-75"
              : "bg-gradient-to-r from-red-50 to-pink-50 border-red-300 shadow-md"
          }`}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className={`font-bold text-lg ${n.read_at ? "text-gray-700" : "text-red-700"}`}>
                  {n.title}
                </h4>
                {!n.read_at && (
                  <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">
                    NEW
                  </span>
                )}
              </div>
              <p className={`text-sm mt-2 ${n.read_at ? "text-gray-600" : "text-gray-800"}`}>
                {n.body}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-xs text-gray-500">
                  {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                </p>
                {n.request_id && (
                  <span className="text-xs text-blue-600 font-medium">Request #{n.request_id}</span>
                )}
              </div>
            </div>
            {!n.read_at && (
              <button
                type="button"
                onClick={() => markRead(n.id)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition whitespace-nowrap"
              >
                Mark Read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
