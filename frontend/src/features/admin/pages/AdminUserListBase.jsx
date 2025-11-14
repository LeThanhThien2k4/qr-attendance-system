import React, { useEffect, useState } from "react";
import { Trash2, Edit3, Upload, Download } from "lucide-react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

export default function AdminUserListBase({ title, roleFilter }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    email: "",
    password: "",
    role: roleFilter,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // === Load danh sách ===
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users`);
      const filtered = (res.data.users || res.data).filter(
        (u) => u.role === roleFilter
      );
      setUsers(filtered);
    } catch {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // === CRUD ===
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email)
      return toast.error("Vui lòng nhập đủ thông tin");
    if (!editingId && !form.password)
      return toast.error("Cần mật khẩu cho tài khoản mới");

    try {
      if (editingId) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await api.put(`/admin/users/${editingId}`, updateData);
        toast.success("Cập nhật thành công");
      } else {
        await api.post("/admin/users", form);
        toast.success("Tạo thành công");
      }
      setForm({
        code: "",
        name: "",
        email: "",
        password: "",
        role: roleFilter,
      });
      setEditingId(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi xử lý dữ liệu");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tài khoản này?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Đã xóa");
      loadUsers();
    } catch {
      toast.error("Không thể xóa người dùng");
    }
  };

  const handleEdit = (u) => {
    setForm({
      code: u.code || u.studentCode || u.lecturerCode || "",
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
    });
    setEditingId(u._id);
  };

  // === IMPORT EXCEL ===
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post(`/admin/users/import?role=${roleFilter}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data.message || "Import thành công");
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import thất bại");
    }
  };

  // === EXPORT EXCEL ===
  const handleExport = async () => {
    try {
      const res = await api.get(`/admin/users/export?role=${roleFilter}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        roleFilter === "student"
          ? "DanhSachSinhVien.xlsx"
          : "DanhSachGiangVien.xlsx"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Đã xuất file Excel");
    } catch {
      toast.error("Lỗi khi export dữ liệu");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-xl border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder={roleFilter === "student" ? "Mã SV" : "Mã GV"}
          className="border rounded p-2"
        />
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Họ tên"
          className="border rounded p-2"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="border rounded p-2"
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Mật khẩu"
          className="border rounded p-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 col-span-full"
        >
          {editingId ? "Cập nhật" : "Thêm mới"}
        </button>
      </form>

      {/* NÚT IMPORT / EXPORT */}
      <div className="flex items-center gap-3">
        <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2">
          <Upload size={16} /> Import Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
        </label>
        <button
          onClick={handleExport}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2"
        >
          <Download size={16} /> Export Excel
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="py-2 px-3 text-left">#</th>
              <th className="py-2 px-3 text-left">Mã</th>
              <th className="py-2 px-3 text-left">Tên</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-6">
                  Đang tải...
                </td>
              </tr>
            ) : users.length ? (
              users.map((u, i) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    {u.code || u.studentCode || u.lecturerCode || "-"}
                  </td>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
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
                <td
                  colSpan="5"
                  className="text-center py-6 text-gray-500 italic"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
