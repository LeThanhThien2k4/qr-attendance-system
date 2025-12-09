import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../lib/axios";
import jwt_decode from "jwt-decode";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem("current_role");
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  /* =====================================
      HANDLE LOGIN
  ===================================== */
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">

      {/* Background animation */}
      <div className="absolute inset-0 animate-[pulse_6s_ease-in-out_infinite] opacity-20 bg-[radial-gradient(circle_at_30%_20%,#60a5fa,transparent_20%),radial-gradient(circle_at_80%_80%,#60a5fa,transparent_20%)]"></div>

      {/* CARD */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 w-full max-w-md p-8 bg-white/90 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200 animate-[fadeIn_0.5s_ease-out]"
      >
        <h1 className="text-2xl text-center font-extrabold text-blue-600 mb-6 tracking-wide">
          QR Attendance System
        </h1>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600">Email</label>
          <div className="flex items-center border rounded-xl px-3 py-2 mt-1 bg-white shadow-sm hover:shadow-md transition-all">
            <Mail className="w-5 h-5 text-gray-500 mr-2" />
            <input
              className="flex-1 outline-none text-gray-800"
              placeholder="Nhập email..."
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600">Mật khẩu</label>
          <div className="flex items-center border rounded-xl px-3 py-2 mt-1 bg-white shadow-sm hover:shadow-md transition-all">
            <Lock className="w-5 h-5 text-gray-500 mr-2" />

            <input
              className="flex-1 outline-none text-gray-800"
              placeholder="••••••••"
              type={showPwd ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* LOGIN BUTTON */}
        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-md"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {/* OTP RESET PASSWORD */}
        <div className="pt-4 text-center">
          <p 
            onClick={() => navigate("/forgot-password")}
            className="text-blue-600 text-sm text-right cursor-pointer hover:underline"
          >
            Quên mật khẩu?
</p>

        </div>
      </form>
    </div>
  );
}
