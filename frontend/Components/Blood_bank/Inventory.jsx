import { useState, useEffect, useContext } from "react";
import { Link } from "react-router";
import { API_URL } from "../../src/lib/env";
import AuthContext from "../../src/Context/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { usePageTitle } from "../../src/hooks/usePageTitle";

const Inventory = () => {
  const { user } = useContext(AuthContext);
  usePageTitle(); // Set page title based on route
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

  // Transform inventory into matrix format (blood groups as rows, components as columns)
  const buildInventoryMatrix = () => {
    const matrix = {};
    const componentTotals = {};
    
    // Initialize component totals
    components.forEach(comp => {
      componentTotals[comp] = 0;
    });

    // Build matrix and calculate totals
    bloodGroups.forEach(bg => {
      matrix[bg] = {};
      components.forEach(comp => {
        const item = inventory.find(
          inv => inv.blood_group === bg && inv.component === comp
        );
        const units = item ? item.units_available : 0;
        matrix[bg][comp] = item || null; // Store the full item for edit/delete
        componentTotals[comp] += units;
      });
    });

    // Calculate row totals (blood group totals)
    const rowTotals = {};
    bloodGroups.forEach(bg => {
      rowTotals[bg] = components.reduce((sum, comp) => {
        const item = matrix[bg][comp];
        return sum + (item ? item.units_available : 0);
      }, 0);
    });

    // Calculate grand total
    const grandTotal = Object.values(rowTotals).reduce((sum, total) => sum + total, 0);

    return { matrix, componentTotals, rowTotals, grandTotal };
  };

  const { matrix, componentTotals, rowTotals, grandTotal } = buildInventoryMatrix();

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Blood Inventory Management</h2>
          <p className="text-gray-600">Track and manage your blood inventory across all blood groups and components</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditing(null);
            setFormData({ blood_group: "", component: "", units_available: 0 });
          }}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
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
        <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-xl p-8 mb-8 border-2 border-red-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-xl">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {editing ? "Edit Inventory Item" : "Add New Inventory Item"}
            </h3>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group *</label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                required
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Component *</label>
              <select
                value={formData.component}
                onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                required
              >
                <option value="">Select Component</option>
                {components.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Units Available *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={formData.units_available}
                  onChange={(e) =>
                    setFormData({ ...formData, units_available: parseInt(e.target.value) || 0 })
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  placeholder="0"
                  required
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition shadow-lg hover:shadow-xl font-semibold"
                >
                  {editing ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table - Tabular Format (Components as Columns, Blood Groups as Rows) */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-lg border border-red-800 sticky left-0 bg-gradient-to-r from-red-600 to-red-700 z-10 shadow-lg">
                  Blood Group
                </th>
                {components.map((comp) => (
                  <th key={comp} className="px-6 py-4 text-center font-bold border border-red-800 min-w-[140px]">
                    {comp}
                  </th>
                ))}
                <th className="px-6 py-4 text-center font-bold border border-red-800 bg-red-800 min-w-[120px]">
                  Total
                </th>
                <th className="px-6 py-4 text-center font-bold border border-red-800 bg-red-800 min-w-[180px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={components.length + 3} className="px-6 py-8 text-center text-gray-500">
                    No inventory items. Add your first item above.
                  </td>
                </tr>
              ) : (
                <>
                  {bloodGroups.map((bg) => {
                    const hasInventory = components.some(comp => matrix[bg][comp] !== null);
                    return (
                      <tr key={bg} className={`hover:bg-gray-50 transition ${!hasInventory ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-bold text-gray-800 border border-gray-200 sticky left-0 bg-white z-10">
                          {bg}
                        </td>
                        {components.map((comp) => {
                          const item = matrix[bg][comp];
                          const units = item ? item.units_available : 0;
                          return (
                            <td
                              key={`${bg}-${comp}`}
                              className="px-4 py-3 text-center border border-gray-200"
                            >
                              {item ? (
                                <span
                                  className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(units)}`}
                                >
                                  {units}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center font-semibold text-gray-800 border border-gray-200 bg-gray-50">
                          {rowTotals[bg]}
                        </td>
                        <td className="px-6 py-4 text-center border border-gray-200 bg-gray-50">
                          {(() => {
                            if (!hasInventory) return null;
                            
                            // Get the first inventory item for this blood group from the matrix
                            // This ensures only ONE set of buttons per row
                            let firstItem = null;
                            for (const comp of components) {
                              if (matrix[bg] && matrix[bg][comp] !== null && matrix[bg][comp] !== undefined) {
                                firstItem = matrix[bg][comp];
                                break; // Stop at first found item
                              }
                            }
                            
                            // Only render buttons if we found an item
                            if (!firstItem) return null;
                            
                            return (
                              <div key={`actions-${bg}`} className="flex gap-3 justify-center items-center">
                                <button
                                  onClick={() => handleEdit(firstItem)}
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Edit this inventory item"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(firstItem.id)}
                                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Delete this inventory item"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-4 py-3 text-gray-800 border border-gray-300 sticky left-0 bg-gray-100 z-10">
                      Total
                    </td>
                    {components.map((comp) => (
                      <td key={`total-${comp}`} className="px-4 py-3 text-center text-gray-800 border border-gray-300">
                        {componentTotals[comp]}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center text-gray-800 border border-gray-300 bg-red-50">
                      {grandTotal}
                    </td>
                    <td className="px-4 py-3 border border-gray-300"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
