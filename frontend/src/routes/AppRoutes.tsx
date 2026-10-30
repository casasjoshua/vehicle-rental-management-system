
import { Route, Routes } from "react-router-dom";

import MainLayout from "../layout/MainLayout";
import DashboardLayout from "../layout/DashboardLayout";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import VehiclesPage from "../pages/VehiclesPage";
import VehicleDetailsPage from "../pages/VehicleDetailsPage";

import DashboardPage from "../pages/DashboardPage";
import BrowseVehiclesPage from "../pages/BrowseVehiclesPage";
import VehicleManagementPage from "../pages/VehicleManagementPage";
import BookingsPage from "../pages/BookingsPage";
import SettingsPage from "../pages/SettingsPage";
import UsersPage from "../pages/UsersPage";
import ReportsPage from "../pages/ReportsPage";
import NotFoundPage from "../pages/NotFoundPage";

import ProtectedRoute from "../features/auth/components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ========================================
          PUBLIC ROUTES
      ======================================== */}
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/vehicles"
          element={<VehiclesPage />}
        />

        <Route
          path="/vehicles/:id"
          element={<VehicleDetailsPage />}
        />
      </Route>

      {/* ========================================
          PROTECTED DASHBOARD ROUTES
      ======================================== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {/* Browse Vehicles */}
          <Route
            path="/dashboard/browse-vehicles"
            element={<BrowseVehiclesPage />}
          />

          {/* Vehicle Management */}
          <Route
            path="/dashboard/vehicles"
            element={<VehicleManagementPage />}
          />

          {/* My Bookings */}
          <Route
            path="/dashboard/bookings"
            element={<BookingsPage />}
          />

          {/* Customer Management */}
          <Route
            path="/dashboard/users"
            element={<UsersPage title="Customer Management" />}
          />

          {/* Reports */}
          <Route
            path="/dashboard/reports"
            element={<ReportsPage />}
          />

          {/* Account Settings */}
          <Route
            path="/dashboard/settings"
            element={<SettingsPage />}
          />
        </Route>
      </Route>

      {/* ========================================
          404 NOT FOUND
      ======================================== */}
      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
}
