import React, { useState, useEffect } from "react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ChangePasswordWithOTP() {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();

  /* -------------------------------
      GỬI OTP
  --------------------------------*/
  const requestOTP = async () => {
    try {
      await api.put("/auth/change-password/request-otp");
      toast.success("OTP đã gửi về email!");

      setStep(2);
      setTimer(60); // 60s đếm ngược
    } catch {
      toast.error("Không thể gửi OTP");
    }
  };

  /* -------------------------------
      ĐẾM NGƯỢC RESEND
  --------------------------------*/
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* -------------------------------
      XÁC THỰC OTP + ĐỔI MK
  --------------------------------*/
  const submitChange = async () => {
    if (!otp || !newPassword)
      return toast.error("Điền đầy đủ thông tin");

    try {
      await api.put("/auth/change-password/verify", {
        otp,
        newPassword,
      });

      toast.success("Đổi mật khẩu thành công! Hãy đăng nhập lại.");
      localStorage.removeItem("token");
      navigate("/login");

    } catch (err) {
      toast.error(err.response?.data?.message || "OTP không hợp lệ");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow space-y-6 border">

      <h1 className="text-xl font-bold text-center">Đổi mật khẩu bằng OTP</h1>

      {/* ================= STEP 1 ================= */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Nhấn nút bên dưới để gửi mã OTP xác nhận đổi mật khẩu về email của bạn.
          </p>

          <button
            onClick={requestOTP}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
          >
            Gửi OTP
          </button>
        </div>
      )}

      {/* ================= STEP 2 ================= */}
      {step === 2 && (
        <div className="space-y-4">

          <div>
            <label className="text-sm font-medium">Nhập OTP</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded-lg mt-1"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Ví dụ: 123456"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Mật khẩu mới</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded-lg mt-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            onClick={submitChange}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition"
          >
            Xác nhận đổi mật khẩu
          </button>

          <div className="text-center text-sm text-gray-500 mt-3">
            {timer > 0 ? (
              <span>Gửi lại OTP sau {timer}s</span>
            ) : (
              <button
                onClick={requestOTP}
                className="text-blue-600 hover:underline"
              >
                Gửi lại OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
