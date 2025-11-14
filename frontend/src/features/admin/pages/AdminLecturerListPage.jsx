import React from "react";
import AdminUserListBase from "./AdminUserListBase.jsx";

export default function AdminLecturerListPage() {
  return (
    <AdminUserListBase title="Quản lý giảng viên" roleFilter="lecturer" />
  );
}
