import { useContext } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import AuthContext from "../../src/Context/AuthContext";

const AdminNavBar = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-white text-red-600 shadow-md"
        : "text-white hover:bg-red-500"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-red-50">
      <nav className="sticky top-0 z-50 bg-red-600 px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Admin Panel
        </h1>

        <div className="flex gap-3 font-medium">
          <NavLink to="dashboard" className={navClass}>Dashboard</NavLink>
          <NavLink to="notification" className={navClass}>🔔 Notifications</NavLink>
          <NavLink to="donors" className={navClass}>Donors</NavLink>
          <NavLink to="users" className={navClass}>Users</NavLink>
          <NavLink to="hospitals" className={navClass}>Hospitals</NavLink>
          <NavLink to="history" className={navClass}>History</NavLink>
        </div>

        <button
          onClick={handleLogout}
          className="bg-white text-red-600 px-5 py-2 rounded-lg font-semibold shadow hover:scale-105 transition"
        >
          Logout
        </button>
      </nav>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminNavBar;
