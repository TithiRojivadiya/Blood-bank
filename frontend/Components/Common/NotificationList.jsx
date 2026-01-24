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
    <div className="space-y-3">
      {list.map((n) => (
        <div
          key={n.id}
          className={`p-4 rounded-xl border ${n.read_at ? "bg-gray-50 border-gray-200" : "bg-red-50/50 border-red-200"}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900">{n.title}</h4>
              <p className="text-sm text-gray-700 mt-1">{n.body}</p>
              <p className="text-xs text-gray-500 mt-2">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</p>
            </div>
            {!n.read_at && (
              <button
                type="button"
                onClick={() => markRead(n.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
