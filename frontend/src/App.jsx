import { Routes, Route, Navigate } from "react-router";

import Login from "../Components/Common/Login";
import Signup from "../Components/Common/SignUp";

// Layouts
import PatientNavBar from "../Components/Common/PatientNavBar";
import DonorNavBar from "../Components/Common/DonorNavBar";
import AdminNavBar from "../Components/Common/AdminNavBar";
import BloodBankNavBar from "../Components/Common/BloodBankNavBar";

// Dashboards
import PatientDashboard from "../Components/Patient/Dashboard";
import DonorDashboard from "../Components/Donor/Dashboard";
import AdminDashboard from "../Components/Admin/Dashboard";
import BloodBankDashboard from "../Components/Blood_bank/Dashboard";

// Patient pages
import PatientProfile from "../Components/Patient/Profile";
import PatientNotification from "../Components/Patient/Notification";
import PatientRequest from "../Components/Patient/Request";

// Donor pages
import DonorProfile from "../Components/Donor/Profile";
import DonorNotification from "../Components/Donor/Notification";

// Admin pages
import AdminNotification from "../Components/Admin/Notification";
import AdminDonors from "../Components/Admin/Donors";
import AdminUsers from "../Components/Admin/Users";
import AdminHospitals from "../Components/Admin/Hospitals";

// Blood Bank pages
import BloodBankProfile from "../Components/Blood_bank/Profile";
import BloodBankNotification from "../Components/Blood_bank/Notification";
import BloodBankInventory from "../Components/Blood_bank/Inventory";

const App = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Patient */}
      <Route path="/patient" element={<PatientNavBar />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="notification" element={<PatientNotification />} />
        <Route path="request" element={<PatientRequest />} />
      </Route>

      {/* Donor */}
      <Route path="/donor" element={<DonorNavBar />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<DonorDashboard />} />
        <Route path="profile" element={<DonorProfile />} />
        <Route path="notification" element={<DonorNotification />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminNavBar />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="notification" element={<AdminNotification />} />
        <Route path="donors" element={<AdminDonors />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="hospitals" element={<AdminHospitals />} />
      </Route>

      {/* Blood Bank (IMPORTANT: path matches navbar) */}
      <Route path="/blood-bank" element={<BloodBankNavBar />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<BloodBankDashboard />} />
        <Route path="inventory" element={<BloodBankInventory />} />
        <Route path="notification" element={<BloodBankNotification />} />
        <Route path="profile" element={<BloodBankProfile />} />
      </Route>
    </Routes>
  );
};

export default App;

