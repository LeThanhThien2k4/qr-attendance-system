import React, { useState } from "react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

export default function CreateAdminPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password)
      return toast.error("Vui lòng nhập đầy đủ thông tin");

    try {
      await api.post("/admin/create-admin", form);
      toast.success("Tạo admin thành công!");
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi tạo admin");
    }
  };

  return (
    <div className="max-w-lg bg-white p-6 rounded-xl shadow border mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Tạo Admin mới</h2>

      <input
        name="name"
        placeholder="Tên Admin"
        value={form.name}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        name="password"
        type="password"
        placeholder="Mật khẩu"
        value={form.password}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Tạo Admin
      </button>
    </div>
  );
}
