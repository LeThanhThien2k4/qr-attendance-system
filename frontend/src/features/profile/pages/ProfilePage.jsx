import React, { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { User, Mail, Shield } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setProfile(res.data);
        setForm({
          fullName: res.data.fullName || "",
          email: res.data.email || "",
        });
      } catch (err) {
        console.error("❌ Lỗi tải thông tin người dùng:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      const res = await api.put("/users/me", form);
      toast.success("Cập nhật thông tin thành công!");
      setProfile(res.data);
      setEditing(false);
    } catch (err) {
      toast.error("Lỗi khi cập nhật thông tin");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <p>Đang tải thông tin...</p>
      </div>
    );

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <User className="text-blue-600" />
        Thông tin tài khoản
      </h1>

      {!editing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="text-gray-600" />
            <span>{profile.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="text-gray-600" />
            <span>{profile.fullName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="text-gray-600" />
            <span className="uppercase text-sm bg-gray-100 px-2 py-1 rounded">
              {profile.role}
            </span>
          </div>

          <button
            onClick={() => setEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Chỉnh sửa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            className="w-full border rounded p-2"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Họ và tên"
          />
          <input
            type="email"
            className="w-full border rounded p-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
          />

          <div className="flex gap-3 mt-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Lưu
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
