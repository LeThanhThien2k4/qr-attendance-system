import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

/* ========== TẠO TÀI KHOẢN MỚI ========== */
export const createUser = async (req, res) => {
    try {
          console.log("BODY:", req.body);
    console.log("USER:", req.user);
    const { code, name, email, password, role, phone } = req.body;

    if (!code || !name || !email || !password || !role)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });

    // Kiểm tra trùng mã hoặc email
    const exists = await User.findOne({ $or: [{ code }, { email }] });
    if (exists)
      return res
        .status(400)
        .json({ message: "Mã hoặc email đã tồn tại" });

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = await User.create({
      code,
      name,
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      phone,
    });

    res.json({ message: "Tạo tài khoản thành công", user: newUser });
  } catch (err) {
        console.error("❌ CREATE USER ERROR:", err);
        
    res.status(500).json({ message: err.message });
  }
};

/* ========== LẤY DANH SÁCH USERS ========== */
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select("-password") // ẩn password khi trả về
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ========== XOÁ TÀI KHOẢN ========== */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "Đã xoá người dùng" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ========== CẬP NHẬT NGƯỜI DÙNG ========== */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, email, password, role, phone, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Cập nhật các trường cho phép
    if (code) user.code = code;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role.toLowerCase(); // chuyển về enum chuẩn
    if (typeof isActive !== "undefined") user.isActive = isActive;

    // Nếu có thay đổi mật khẩu
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: "Cập nhật thành công", user });
  } catch (err) {
    console.error("❌ UPDATE USER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};