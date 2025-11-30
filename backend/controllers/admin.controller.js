import User from "../models/user.model.js";
import bcrypt from "bcrypt";

export const createAdmin = async (req, res) => {
  try {
    console.log("📥 Received Body:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log("❌ Missing data");
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const exists = await User.findOne({ email });
    console.log("🔎 Exists:", exists);

    if (exists) return res.status(400).json({ message: "Email đã tồn tại" });

    const hash = await bcrypt.hash(password, 10);
    console.log("🔐 Hash created");

    const newAdmin = await User.create({
      name,
      email,
      password: hash,
      role: "admin",
    });

    console.log("✅ Admin created", newAdmin);

    res.status(201).json({
      message: "Tạo admin thành công",
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
      },
    });
  } catch (err) {
    console.error("🔥 ERROR CREATE ADMIN:", err);
    res.status(500).json({ message: err.message });
  }
};
