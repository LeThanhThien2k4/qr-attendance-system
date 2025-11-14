import React from "react";
import AdminUserListBase from "./AdminUserListBase.jsx";

export default function AdminStudentListPage() {
  return (
    <AdminUserListBase title="Quản lý sinh viên" roleFilter="student" />
  );
}
