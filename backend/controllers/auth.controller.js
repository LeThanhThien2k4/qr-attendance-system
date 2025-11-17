import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    console.log("===== LOGIN REQUEST =====");
    console.log("REQ BODY:", req.body);

    // 1) Validate input FE
    if (!email || !password) {
      console.log("❌ Missing email/password at FE");
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
    }

    // 2) Tìm user trong DB
    const user = await User.findOne({ email });
    console.log("FOUND USER:", user);

    if (!user) {
      console.log("❌ User not found in DB");
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    if (!user.password) {
      console.log("❌ DB password is undefined => user bị lỗi DB");
      return res.status(500).json({
        message: "Tài khoản bị lỗi: password không tồn tại trong DB",
      });
    }

    console.log("COMPARE => password:", password, " | hash:", user.password);

    // 3) So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("❌ Wrong password, compare failed");
      return res.status(401).json({ message: "Sai mật khẩu" });
    }

    // 4) Gen token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role.toLowerCase(), // đảm bảo role luôn lowercase
        email: user.email,
        name: user.fullName || user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ LOGIN SUCCESS");

    return res.json({
      message: "Đăng nhập thành công",
      token,
      role: user.role,
    });
  } catch (err) {
    
    console.error("❌ LOGIN ERROR:", err);
    return res.status(500).json({ message: "Lỗi server khi đăng nhập" });
  }
};


// ===============================================
// ĐỔI MẬT KHẨU
// ===============================================

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match)
      return res.status(400).json({ message: "Old password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
