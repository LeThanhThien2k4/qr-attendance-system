import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequireRole({ allowedRoles }) {
  const { token, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!token) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user?.role))
    return <Navigate to="/login" replace />;

  return <Outlet />;
}
