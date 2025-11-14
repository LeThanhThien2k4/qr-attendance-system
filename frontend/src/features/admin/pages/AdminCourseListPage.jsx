// src/features/admin/pages/AdminCourseListPage.jsx
import React, { useState, useEffect } from "react";
import { Edit3, Trash2, Plus } from "lucide-react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

export default function AdminCourseListPage() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: "", name: "", credit: 3 });
  const [editingId, setEditingId] = useState(null);

  const loadCourses = async () => {
    try {
      const res = await api.get("/admin/courses");
      setCourses(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách môn học");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) return toast.error("Vui lòng nhập đủ thông tin");

    try {
      if (editingId) {
        await api.put(`/admin/courses/${editingId}`, form);
        toast.success("Cập nhật thành công");
      } else {
        await api.post("/admin/courses", form);
        toast.success("Thêm môn học thành công");
      }
      setForm({ code: "", name: "", credit: 3 });
      setEditingId(null);
      loadCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu dữ liệu");
    }
  };

  const handleEdit = (course) => {
    setForm(course);
    setEditingId(course._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá môn học này?")) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      toast.success("Đã xoá");
      loadCourses();
    } catch {
      toast.error("Không thể xoá");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý môn học</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 shadow-sm border rounded-lg grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Mã môn học"
          className="border rounded-lg px-3 py-2"
        />
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Tên môn học"
          className="border rounded-lg px-3 py-2"
        />
        <input
          name="credit"
          value={form.credit}
          onChange={handleChange}
          type="number"
          placeholder="Số tín chỉ"
          className="border rounded-lg px-3 py-2"
        />
        <button className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
          {editingId ? "Cập nhật" : "Thêm mới"}
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Mã</th>
              <th className="p-2 text-left">Tên</th>
              <th className="p-2 text-left">Số tín chỉ</th>
              <th className="p-2 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{c.code}</td>
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.credit}</td>
                <td className="p-2 text-center flex justify-center gap-3">
                  <button onClick={() => handleEdit(c)} className="text-blue-600">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(c._id)} className="text-red-500">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
