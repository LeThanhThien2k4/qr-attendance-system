import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import Login from "../pages/Login";
import Home from "../pages/Home";
import AttendancePage from "../pages/Attendance";
import ProtectedRoute from "./ProtectedRoute";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import Logout from "../pages/Logout";
import AttendanceScan from "../pages/AttendanceScan"; 

export default function AppRoutes() {
  return (
    <Routes>
      {/* ✅ Các route công khai */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ✅ Các route yêu cầu đăng nhập */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/scan" element={<AttendanceScan />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* ✅ Bắt route sai */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
