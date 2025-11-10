// src/features/admin/pages/AdminUserListPage.jsx
import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

export default function AdminUserListPage() {
  console.log("AdminUserListPage loaded!");

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- LOAD USERS ---
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data.users || res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // --- HANDLE FORM ---
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!form.name || !form.email)
    return toast.error("Vui lòng nhập đầy đủ thông tin");
  if (!editingId && !form.password)
    return toast.error("Vui lòng nhập mật khẩu cho tài khoản mới");

  try {
    if (editingId) {
      // UPDATE
      const updateData = { ...form };
      if (!updateData.password) delete updateData.password;
      const res = await api.put(`/admin/users/${editingId}`, updateData);
      toast.success("Cập nhật thành công");
    } else {
      // CREATE
      const res = await api.post("/admin/users", form);
      toast.success("Tạo tài khoản thành công");
    }
    setForm({ code: "", name: "", email: "", password: "", role: "student" });
    setEditingId(null);
    loadUsers();
  } catch (err) {
    toast.error(err.response?.data?.message || "Lỗi xử lý dữ liệu");
  }
};

  // --- DELETE USER ---
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa người dùng này?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Đã xóa");
      loadUsers();
    } catch (err) {
      toast.error("Không thể xóa người dùng");
    }
  };

  // --- EDIT USER ---
  const handleEdit = (u) => {
    setForm({
      code: u.code || "",
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "student",
    });
    setEditingId(u._id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Quản lý người dùng (Sinh viên & Giảng viên)
      </h1>

      {/* --- FORM --- */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-4 shadow-sm border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Mã người dùng"
          className="border rounded-lg px-3 py-2"
        />
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Họ và tên"
          className="border rounded-lg px-3 py-2"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="border rounded-lg px-3 py-2"
        />
        <input
          name="password"
          value={form.password}
          onChange={handleChange}
          type="password"
          placeholder="Mật khẩu"
          className="border rounded-lg px-3 py-2"
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border rounded-lg px-3 py-2"
        >
          <option value="student">Sinh viên</option>
          <option value="lecturer">Giảng viên</option>
        </select>

        <button
          type="submit"
          className="col-span-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {editingId ? "Cập nhật" : "Thêm người dùng"}
        </button>
      </form>

      {/* --- DANH SÁCH --- */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b text-gray-700">
            <tr>
              <th className="py-2 px-3 text-left">#</th>
              <th className="py-2 px-3 text-left">Mã</th>
              <th className="py-2 px-3 text-left">Tên</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-left">Vai trò</th>
              <th className="py-2 px-3 text-left">Trạng thái</th>
              <th className="py-2 px-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-6">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : users.length ? (
              users.map((u, i) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{u.code}</td>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    {u.role === "student" ? "Sinh viên" : "Giảng viên"}
                  </td>
                  <td className="px-3 py-2">
                    {u.isActive ? (
                      <span className="text-green-600">Hoạt động</span>
                    ) : (
                      <span className="text-gray-500">Khóa</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(u)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  Chưa có người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
