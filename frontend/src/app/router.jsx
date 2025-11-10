import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// AUTH
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import ChangePasswordPage from "../features/auth/pages/ChangePasswordPage.jsx";
import RequireRole from "../features/auth/components/RequireRole.jsx";

// LAYOUT
import DashboardLayout from "../layouts/DashboardLayout.jsx";

// ADMIN
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage.jsx";
import AdminUserListPage from "../features/admin/pages/AdminUserListPage.jsx";
import AdminUserImportPage from "../features/admin/pages/AdminUserImportPage.jsx";

// LECTURER
import LecturerDashboardPage from "../features/dashboard/pages/LecturerDashboardPage.jsx";

// STUDENT
import StudentDashboardPage from "../features/dashboard/pages/StudentDashboardPage.jsx";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <DashboardLayout />, // Layout chung có Outlet
    children: [
      { path: "change-password", element: <ChangePasswordPage /> },

      // === ADMIN ===
      {
        path: "admin/dashboard",
        element: (
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/users",
        element: (
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminUserListPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/import",
        element: (
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminUserImportPage />
          </RequireRole>
        ),
      },

      // === LECTURER ===
      {
        path: "lecturer/dashboard",
        element: (
          <RequireRole allowedRoles={["LECTURER"]}>
            <LecturerDashboardPage />
          </RequireRole>
        ),
      },

      // === STUDENT ===
      {
        path: "student/dashboard",
        element: (
          <RequireRole allowedRoles={["STUDENT"]}>
            <StudentDashboardPage />
          </RequireRole>
        ),
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
