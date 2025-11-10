import bcrypt from "bcryptjs";
import fs from "fs";
import User from "../models/user.model.js";
import Counter from "../models/counter.model.js";
import { parseExcel } from "../utils/excelParser.js";

/**
 * Sinh mã định danh tự động theo vai trò và năm hiện tại
 * VD: 2500000001 hoặc GV2500000001
 */
async function generateCode(role) {
  const year = new Date().getFullYear().toString().slice(-2);
  const key = role === "STUDENT" ? `student_${year}` : `lecturer_${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );
  const seq = counter.value.toString().padStart(4, "0");
  return role === "STUDENT" ? `${year}0000${seq}` : `GV${year}0000${seq}`;
}

/**
 * Admin tạo một tài khoản đơn
 */
export const createUser = async (req, res) => {
  try {
    const { fullName, email, role, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email đã tồn tại" });

    let studentCode, lecturerCode;
    if (role === "STUDENT") studentCode = await generateCode("STUDENT");
    if (role === "LECTURER") lecturerCode = await generateCode("LECTURER");

    const hash = await bcrypt.hash(password || "123456", 10);
    const newUser = new User({
      fullName,
      email,
      role,
      password: hash,
      studentCode,
      lecturerCode,
      mustChangePassword: true,
    });

    await newUser.save();
    res.json({
      success: true,
      message: "Tạo tài khoản thành công",
      role,
      code: studentCode || lecturerCode,
      slug: newUser.slug,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin import nhiều user từ file Excel
 */
export const importUsers = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Không có file tải lên" });

    const rows = parseExcel(file.path);
    fs.unlinkSync(file.path);

    const results = [];
    for (const row of rows) {
      const { fullName, email, role } = row;
      if (!email || !role) continue;

      const exists = await User.findOne({ email });
      if (exists) {
        results.push({ email, status: "skipped (exists)" });
        continue;
      }

      const code = await generateCode(role);
      const hash = await bcrypt.hash("123456", 10);

      const newUser = new User({
        fullName,
        email,
        role,
        password: hash,
        studentCode: role === "STUDENT" ? code : undefined,
        lecturerCode: role === "LECTURER" ? code : undefined,
        mustChangePassword: true,
      });

      await newUser.save();
      results.push({ email, code, role, status: "created" });
    }

    res.json({
      success: true,
      message: "Import thành công",
      imported: results.length,
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Lấy danh sách tất cả user (chỉ Admin)
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy thông tin user theo slug
 */
export const getUserBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await User.findOne({ slug }).select("-password");
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy thông tin user đang đăng nhập (dành cho FE /users/me)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin: thống kê người dùng theo vai trò và năm
 */
export const getUserStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    const byRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const byYear = await User.aggregate([
      { $group: { _id: "$academicYear", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      success: true,
      total,
      byRole,
      byYear,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
