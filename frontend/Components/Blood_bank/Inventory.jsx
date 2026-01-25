import { useState, useEffect, useContext } from "react";
import { Link } from "react-router";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";
import { supabase } from "../../src/lib/supabase";

const Inventory = () => {
  const { user } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ blood_group: "", component: "", units_available: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const components = ["Whole Blood", "RBC", "Platelets", "Plasma"];

  const hospitalId = user?.id;

  const fetchInventory = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const [invRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/inventory/${hospitalId}`),
        fetch(`${API_URL}/api/inventory/${hospitalId}/summary`),
      ]);
      const invRaw = await invRes.json().catch(() => []);
      const summaryRaw = await summaryRes.json().catch(() => ({}));
      const invList = Array.isArray(invRaw) ? invRaw : [];
      const summaryObj = typeof summaryRaw === "object" && summaryRaw !== null ? summaryRaw : {};
      setInventory(invList);
      setSummary(summaryObj);
    } catch (err) {
      setError("Failed to load inventory");
      console.error(err);
      setInventory([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    fetchInventory();
  }, [hospitalId]);

  // Real-time updates (only when Supabase is configured)
  useEffect(() => {
    if (!hospitalId || !supabase) return;
    const channel = supabase
      .channel(`inventory-${hospitalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory",
          filter: `hospital_id=eq.${hospitalId}`,
        },
        () => fetchInventory()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.blood_group || !formData.component) {
      setError("Please select blood group and component");
      return;
    }
    try {
      setError("");
      const units = Number(formData.units_available) || 0;
      const url = editing
        ? `${API_URL}/api/inventory/${editing.id}`
        : `${API_URL}/api/inventory`;
      const body = editing
        ? { units_available: units }
        : {
            hospital_id: hospitalId,
            blood_group: formData.blood_group,
            component: formData.component,
            units_available: units,
          };
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save");
      }
      await fetchInventory();
      setEditing(null);
      setShowAddForm(false);
      setFormData({ blood_group: "", component: "", units_available: 0 });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({
      blood_group: item.blood_group,
      component: item.component,
      units_available: item.units_available,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      const res = await fetch(`${API_URL}/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) await fetchInventory();
    } catch (err) {
      setError("Failed to delete");
    }
  };

  const getStatusColor = (units) => {
    if (units === 0) return "text-red-600 bg-red-50";
    if (units < 5) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
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
          <p className="text-gray-600 mb-6">Sign in as a hospital or blood bank to manage inventory.</p>
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
        <h2 className="text-3xl font-bold text-gray-800">Blood Inventory Management</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditing(null);
            setFormData({ blood_group: "", component: "", units_available: 0 });
          }}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition shadow-md"
        >
          {showAddForm ? "Cancel" : "+ Add Inventory"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {bloodGroups.map((bg) => {
          const total = summary[bg]?.total ?? 0;
          const statusClasses = getStatusColor(total);
          return (
            <div key={bg} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">{bg}</span>
                <span className={`text-2xl font-bold px-2 py-0.5 rounded ${statusClasses}`}>
                  {total}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Total Units Available</p>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            {editing ? "Edit Inventory" : "Add New Inventory"}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={formData.blood_group}
              onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
            <select
              value={formData.component}
              onChange={(e) => setFormData({ ...formData, component: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">Select Component</option>
              {components.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={formData.units_available}
                onChange={(e) =>
                  setFormData({ ...formData, units_available: parseInt(e.target.value) || 0 })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Units"
                required
              />
              <button
                type="submit"
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                {editing ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Blood Group</th>
                <th className="px-6 py-4 text-left font-semibold">Component</th>
                <th className="px-6 py-4 text-left font-semibold">Available</th>
                <th className="px-6 py-4 text-left font-semibold">Reserved</th>
                <th className="px-6 py-4 text-left font-semibold">Last Updated</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No inventory items. Add your first item above.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.blood_group}</td>
                    <td className="px-6 py-4 text-gray-700">{item.component}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                          item.units_available
                        )}`}
                      >
                        {item.units_available}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.units_reserved || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.last_updated
                        ? new Date(item.last_updated).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
