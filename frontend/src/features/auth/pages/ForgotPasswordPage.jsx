import React, { useState } from "react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Mail, KeyRound, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();

  const requestOTP = async () => {
    try {
      await api.post("/auth/forgot-password/request-otp", { email });
      toast.success("OTP đã gửi về email!");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi OTP");
    }
  };

  const submitChange = async () => {
    try {
      await api.post("/auth/forgot-password/verify", {
        email,
        otp,
        newPassword,
      });

      toast.success("Đổi mật khẩu thành công!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP không hợp lệ");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div
        className="
          w-full max-w-md bg-white p-8 rounded-xl shadow-lg border
          animate-fadeIn
        "
      >
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          {step === 1 ? "Quên mật khẩu" : "Xác minh OTP"}
        </h1>

        {/* Step 1 - Nhập email */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                placeholder="Nhập email"
                className="w-full border pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              onClick={requestOTP}
              className="
                w-full py-3 rounded-lg text-white font-medium
                bg-blue-600 hover:bg-blue-700 transition shadow-md
              "
            >
              Gửi OTP
            </button>
          </div>
        )}

        {/* Step 2 - Nhập OTP + mật khẩu mới */}
        {step === 2 && (
          <div className="space-y-4 animate-slideUp">
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                placeholder="Nhập OTP"
                className="w-full border pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                placeholder="Mật khẩu mới"
                type="password"
                className="w-full border pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button
              onClick={submitChange}
              className="
                w-full py-3 rounded-lg text-white font-medium
                bg-green-600 hover:bg-green-700 transition shadow-md
              "
            >
              Xác nhận thay đổi
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-center text-gray-500 text-sm hover:underline"
            >
              ← Nhập lại email
            </button>
          </div>
        )}
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.45s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}
