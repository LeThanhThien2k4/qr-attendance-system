import React, { useState } from "react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async () => {
    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      toast.success("Đổi mật khẩu thành công!");
      window.location.href = "/";
    } catch {
      toast.error("Lỗi khi đổi mật khẩu");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Đổi mật khẩu</h1>
      <input
        type="password"
        placeholder="Mật khẩu cũ"
        className="w-full border p-2 mb-3 rounded"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mật khẩu mới"
        className="w-full border p-2 mb-4 rounded"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Xác nhận
      </button>
    </div>
  );
}
