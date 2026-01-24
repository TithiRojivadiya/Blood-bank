import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";

// Lazy load all components for code splitting and better performance
const Login = lazy(() => import("../Components/Common/Login"));
const Signup = lazy(() => import("../Components/Common/SignUp"));

// Layouts
const PatientNavBar = lazy(() => import("../Components/Common/PatientNavBar"));
const DonorNavBar = lazy(() => import("../Components/Common/DonorNavBar"));
const AdminNavBar = lazy(() => import("../Components/Common/AdminNavBar"));
const BloodBankNavBar = lazy(() => import("../Components/Common/BloodBankNavBar"));

// Dashboards
const PatientDashboard = lazy(() => import("../Components/Patient/Dashboard"));
const DonorDashboard = lazy(() => import("../Components/Donor/Dashboard"));
const AdminDashboard = lazy(() => import("../Components/Admin/Dashboard"));
const BloodBankDashboard = lazy(() => import("../Components/Blood_bank/Dashboard"));

// Patient pages
const PatientProfile = lazy(() => import("../Components/Patient/Profile"));
const PatientNotification = lazy(() => import("../Components/Patient/Notification"));
const PatientRequest = lazy(() => import("../Components/Patient/Request"));

// Donor pages
const DonorProfile = lazy(() => import("../Components/Donor/Profile"));
const DonorNotification = lazy(() => import("../Components/Donor/Notification"));

// Admin pages
const AdminNotification = lazy(() => import("../Components/Admin/Notification"));
const AdminDonors = lazy(() => import("../Components/Admin/Donors"));
const AdminUsers = lazy(() => import("../Components/Admin/Users"));
const AdminHospitals = lazy(() => import("../Components/Admin/Hospitals"));

// Blood Bank pages
const BloodBankProfile = lazy(() => import("../Components/Blood_bank/Profile"));
const BloodBankNotification = lazy(() => import("../Components/Blood_bank/Notification"));
const BloodBankInventory = lazy(() => import("../Components/Blood_bank/Inventory"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
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
    </Suspense>
  );
};

export default App;

