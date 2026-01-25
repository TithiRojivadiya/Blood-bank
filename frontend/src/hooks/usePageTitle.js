import { useEffect } from 'react';
import { useLocation } from 'react-router';

// Map routes to page titles
const routeTitleMap = {
  '/': 'Home - Blood Donation System',
  '/login': 'Login - Blood Donation System',
  '/signup': 'Sign Up - Blood Donation System',
  '/about-us': 'About Us - Blood Donation System',
  '/patient/dashboard': 'Patient Dashboard - Blood Donation System',
  '/patient/profile': 'Patient Profile - Blood Donation System',
  '/patient/notification': 'Notifications - Blood Donation System',
  '/patient/request': 'Request Blood - Blood Donation System',
  '/patient/history': 'Request History - Blood Donation System',
  '/donor/dashboard': 'Donor Dashboard - Blood Donation System',
  '/donor/profile': 'Donor Profile - Blood Donation System',
  '/donor/notification': 'Notifications - Blood Donation System',
  '/donor/history': 'Donation History - Blood Donation System',
  '/donor/donate': 'Schedule Donation - Blood Donation System',
  '/admin/dashboard': 'Admin Dashboard - Blood Donation System',
  '/admin/notification': 'Notifications - Blood Donation System',
  '/admin/users': 'User Management - Blood Donation System',
  '/admin/history': 'System History - Blood Donation System',
  '/blood-bank/dashboard': 'Blood Bank Dashboard - Blood Donation System',
  '/blood-bank/inventory': 'Inventory Management - Blood Donation System',
  '/blood-bank/profile': 'Blood Bank Profile - Blood Donation System',
  '/blood-bank/notification': 'Notifications - Blood Donation System',
  '/blood-bank/history': 'Blood Bank History - Blood Donation System',
};

export const usePageTitle = (customTitle = null) => {
  const location = useLocation();

  useEffect(() => {
    // Use custom title if provided, otherwise use route-based title
    const title = customTitle || routeTitleMap[location.pathname] || 'Blood Donation System';
    document.title = title;

    // Cleanup: reset to default on unmount
    return () => {
      document.title = 'Blood Donation System';
    };
  }, [location.pathname, customTitle]);
};
