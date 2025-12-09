import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";   // 🔥 BẮT BUỘC PHẢI CÓ
dotenv.config();

/* ============================
    LOGIN
=============================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    if (!user.password)
      return res.status(500).json({ message: "Mật khẩu không tồn tại trong DB" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Sai mật khẩu" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role.toLowerCase(),
        email: user.email,
        name: user.fullName || user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      role: user.role,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi đăng nhập" });
  }
};

/* ============================================
   TẠO TRANSPORTER EMAIL
============================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ============================================
   1) USER NHẬP EMAIL → GỬI OTP
============================================ */
export const forgotPasswordRequestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Thiếu email" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Email không tồn tại" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 5 * 60 * 1000; // 5 phút
    await user.save();

    await transporter.sendMail({
      from: `"QR Attendance System" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "OTP đặt lại mật khẩu",
      html: `
        <h2>OTP đặt lại mật khẩu:</h2>
        <h1 style="color:blue;">${otp}</h1>
        <p>OTP có hiệu lực trong 5 phút.</p>
      `,
    });

    res.json({ message: "OTP đã gửi qua email!" });
  } catch (err) {
    console.error("FORGOT PASSWORD OTP ERROR:", err);
    res.status(500).json({ message: "Không thể gửi OTP" });
  }
};

/* ============================================
   2) USER NHẬP OTP + MẬT KHẨU MỚI
============================================ */
export const forgotPasswordVerifyOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Thiếu dữ liệu" });

    const user = await User.findOne({ email });

    if (!user || !user.resetOtp)
      return res.status(400).json({ message: "OTP không tồn tại" });

    if (user.resetOtp != otp)
      return res.status(400).json({ message: "OTP sai" });

    if (Date.now() > user.resetOtpExpires)
      return res.status(400).json({ message: "OTP đã hết hạn" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Không thể xác minh OTP" });
  }
};