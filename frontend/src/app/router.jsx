import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// AUTH
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import ChangePasswordPage from "../features/auth/pages/ChangePasswordPage.jsx";
import RequireRole from "../features/auth/components/RequireRole.jsx";

// LAYOUT
import DashboardLayout from "../layouts/DashboardLayout.jsx";

// ADMIN
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage.jsx";
import AdminUserImportPage from "../features/admin/pages/AdminUserImportPage.jsx";
import AdminStudentListPage from "../features/admin/pages/AdminStudentListPage.jsx";
import AdminCourseListPage from "../features/admin/pages/AdminCourseListPage.jsx";
import AdminAttendanceListPage from "../features/admin/pages/AdminAttendanceListPage.jsx";
import AdminClassListPage from "../features/admin/pages/AdminClassListPage.jsx";
import AdminOfficialClassListPage from "../features/admin/pages/AdminOfficialClassListPage.jsx";
import AdminLecturerListPage from "../features/admin/pages/AdminLecturerListPage.jsx";

// LECTURER
import LecturerDashboardPage from "../features/dashboard/pages/LecturerDashboardPage.jsx";
import LecturerAttendancePage from "../features/attendance/lecturer/pages/LecturerAttendancePage.jsx";

// STUDENT
import StudentDashboardPage from "../features/attendance/student/pages/StudentDashboardPage.jsx";
import StudentScanPage from "../features/attendance/student/pages/StudentScanPage.jsx";

const router = createBrowserRouter([
  // Redirect root to login
  { path: "/", element: <Navigate to="/login" replace /> },

  // Login
  { path: "/login", element: <LoginPage /> },

  // Protected routes
  {
    element: <DashboardLayout />,
    children: [
      { path: "change-password", element: <ChangePasswordPage /> },

      // ======================= ADMIN =======================
      {
        path: "admin",
        element: <RequireRole allowedRoles={["admin"]} />,
        children: [
          { path: "dashboard", element: <AdminDashboardPage /> },
          { path: "students", element: <AdminStudentListPage /> },
          { path: "lecturers", element: <AdminLecturerListPage /> },
          { path: "courses", element: <AdminCourseListPage /> },
          { path: "attendances", element: <AdminAttendanceListPage /> },
          { path: "classes", element: <AdminClassListPage /> },
          { path: "official-classes", element: <AdminOfficialClassListPage /> },
          { path: "import", element: <AdminUserImportPage /> },
        ],
      },

      // ======================= LECTURER =======================
      {
        path: "lecturer",
        element: <RequireRole allowedRoles={["lecturer"]} />,
        children: [
          { path: "dashboard", element: <LecturerDashboardPage /> },
          { path: "attendance", element: <LecturerAttendancePage /> },
        ],
      },

      // ======================= STUDENT =======================
      {
        path: "student",
        element: <RequireRole allowedRoles={["student"]} />,
        children: [
          { path: "dashboard", element: <StudentDashboardPage /> },
          { path: "attendance", element: <StudentScanPage /> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
