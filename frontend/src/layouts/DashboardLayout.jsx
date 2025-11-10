import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../features/auth/hooks/useAuth";
import api from "../lib/axios";

export default function DashboardLayout() {
  const { user, logout, token, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // Chỉ redirect nếu chắc chắn đã load xong context
  useEffect(() => {
    if (!loading && !token) navigate("/login");
  }, [loading, token, navigate]);

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setProfile(res.data.user || res.data);
      } catch (err) {
        console.warn("Không thể tải thông tin người dùng:", err.message);
      }
    };
    fetchProfile();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const menusByRole = {
    ADMIN: [
      { to: "/admin/dashboard", label: "Tổng quan" },
      { to: "/admin/users", label: "Quản lý người dùng" },
      { to: "/admin/import", label: "Import Excel" },
    ],
    LECTURER: [
      { to: "/lecturer/dashboard", label: "Tổng quan" },
      { to: "/lecturer/classes", label: "Lớp học" },
      { to: "/lecturer/sessions", label: "Buổi học" },
      { to: "/lecturer/notifications", label: "Thông báo" },
    ],
    STUDENT: [
      { to: "/student/dashboard", label: "Tổng quan" },
      { to: "/student/attendance", label: "Điểm danh" },
      { to: "/student/classes", label: "Lớp học" },
      { to: "/student/notifications", label: "Thông báo" },
    ],
  };

  const menus = menusByRole[user?.role] || [];
  const displayName = profile?.fullName || user?.fullName || "Người dùng";

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="p-4 text-xl font-bold text-blue-600 border-b">
          QR Attendance
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          {menus.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 flex items-center justify-center gap-2 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-white flex justify-between items-center px-6">
          <span className="text-gray-700">
            Xin chào, <strong>{displayName}</strong> ({user?.role || "N/A"})
          </span>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
            {displayName?.[0]?.toUpperCase() || "U"}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? "bg-blue-100 text-blue-600 font-medium"
            : "text-gray-700 hover:bg-gray-100"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
