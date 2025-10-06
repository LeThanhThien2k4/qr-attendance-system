import Teacher from "../models/Teacher.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerTeacher = async (req, res) => {
  try {
    const { msgv, hoten, chucvu, email, password } = req.body;
    const existing = await Teacher.findOne({ msgv });
    if (existing) return res.status(400).json({ message: "MSGV đã tồn tại" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newTeacher = new Teacher({ msgv, hoten, chucvu, email, password: hashedPassword });
    await newTeacher.save();

    res.status(201).json({ message: "Đăng ký giảng viên thành công", teacher: newTeacher });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginTeacher = async (req, res) => {
  try {
    const { msgv, password } = req.body;
    const teacher = await Teacher.findOne({ msgv });
    if (!teacher) return res.status(400).json({ message: "MSGV không tồn tại" });

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu" });

    const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Đăng nhập thành công", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
