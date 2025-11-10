import React, { useState } from "react";

export default function UserForm({ onSubmit }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    email: "",
    password: "",
    role: "student",
    phone: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ code: "", name: "", email: "", password: "", role: "student", phone: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow space-y-3">
      <input name="code" value={form.code} onChange={handleChange} placeholder="Mã người dùng" className="w-full border p-2 rounded" required />
      <input name="name" value={form.name} onChange={handleChange} placeholder="Họ tên" className="w-full border p-2 rounded" required />
      <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full border p-2 rounded" required />
      <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Mật khẩu" className="w-full border p-2 rounded" required />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Số điện thoại" className="w-full border p-2 rounded" />
      <select name="role" value={form.role} onChange={handleChange} className="w-full border p-2 rounded">
        <option value="student">Sinh viên</option>
        <option value="lecturer">Giảng viên</option>
      </select>
      <button type="submit" className="bg-blue-600 text-white py-2 rounded w-full">Tạo tài khoản</button>
    </form>
  );
}
