import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Layouts
import MainLayout from './layout/MainLayout';

// Pages
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import Inventory from './pages/Inventory/Inventory';
import ExpiryMonitor from './pages/Expiry/ExpiryMonitor';
import QuarantineCenter from './pages/Quarantine/QuarantineCenter';
import BillingCenter from './pages/Billing/BillingCenter';
import AlertCenter from './pages/Alerts/AlertCenter';
import VendorManagement from './pages/Vendors/VendorManagement';
import Settings from './pages/Settings/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes inside MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="expiry" element={<ExpiryMonitor />} />
              <Route path="quarantine" element={<QuarantineCenter />} />
              <Route path="billing" element={<BillingCenter />} />
              <Route path="alerts" element={<AlertCenter />} />
              <Route path="vendors" element={<VendorManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
