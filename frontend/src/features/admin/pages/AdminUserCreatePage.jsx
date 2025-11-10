import React from "react";
import toast from "react-hot-toast";
import UserForm from "../components/UserForm";
import { userApi } from "../api/userApi";

export default function AdminUserCreatePage() {
  const handleCreate = async (data) => {
    try {
      const res = await userApi.create(data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi tạo tài khoản");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-blue-600">Tạo tài khoản người dùng</h1>
      <UserForm onSubmit={handleCreate} />
    </div>
  );
}
