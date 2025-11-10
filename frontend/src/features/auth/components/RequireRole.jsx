import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequireRole({ allowedRoles, children }) {
  const { user, token } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;

  // Nếu được gọi như <RequireRole>...</RequireRole> thì render children,
  // còn nếu được dùng ở cấp route cha thì render <Outlet />
  return children ? children : <Outlet />;
}
