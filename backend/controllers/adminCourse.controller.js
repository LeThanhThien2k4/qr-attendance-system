// backend/controllers/adminCourse.controller.js
import Course from "../models/course.model.js";

// === Tạo mới ===
export const createCourse = async (req, res) => {
  try {
    const { code, name, credit, lecturer } = req.body;
    const exist = await Course.findOne({ code });
    if (exist) return res.status(400).json({ message: "Mã môn học đã tồn tại" });

    const newCourse = await Course.create({ code, name, credit, lecturer });
    res.json(newCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === Danh sách ===
export const getCourses = async (req, res) => {
  try {
    const list = await Course.find().populate("lecturer", "name email");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === Cập nhật ===
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Course.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy môn học" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === Xóa ===
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Course.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy môn học" });
    res.json({ message: "Đã xóa môn học" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
