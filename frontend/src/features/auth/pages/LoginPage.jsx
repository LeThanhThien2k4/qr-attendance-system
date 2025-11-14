// src/features/auth/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../lib/axios";
import jwt_decode from "jwt-decode";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Xóa role trước đó (tab mới)
    sessionStorage.removeItem("current_role");
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.token;

      login(token);

      const role = jwt_decode(token).role;

      toast.success("Đăng nhập thành công!");

      if (role === "admin") navigate("/admin/dashboard");
      if (role === "lecturer") navigate("/lecturer/dashboard");
      if (role === "student") navigate("/student/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Sai email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-96 space-y-4"
      >
        <h1 className="text-2xl text-center font-bold text-blue-600">
          QR Attendance Login
        </h1>

        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="bg-blue-600 w-full text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
