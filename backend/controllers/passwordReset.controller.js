import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../services/emailService.js";
// Gửi OTP đến email
export const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    // Tạo mã OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email }); // Xóa OTP cũ
    await OTP.create({
      email,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
    });

    await sendEmail(email, otpCode);
    res.json({ message: "Đã gửi mã OTP đến email của bạn" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xác minh OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const record = await OTP.findOne({ email, otpCode });
    if (!record) return res.status(400).json({ message: "OTP không đúng" });

    if (record.expiresAt < new Date())
      return res.status(400).json({ message: "OTP đã hết hạn" });

    record.verified = true;
    await record.save();

    res.json({ message: "OTP hợp lệ, cho phép đặt mật khẩu mới" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đặt lại mật khẩu mới
export const resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    const record = await OTP.findOne({ email, otpCode, verified: true });
    if (!record) return res.status(400).json({ message: "OTP không hợp lệ hoặc chưa xác minh" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await OTP.deleteMany({ email }); // Xóa OTP đã dùng
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
