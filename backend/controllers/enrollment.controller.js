import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";
import Class from "../models/class.model.js";

/* ========== LẤY DANH SÁCH THEO LỚP ========== */
export const getEnrollmentsByClass = async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ message: "Thiếu classId" });

    const list = await Enrollment.find({ classId })
      .populate("studentId", "code name email")
      .populate("classId", "name code");

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ========== THÊM 1 ENROLLMENT ========== */
export const addEnrollment = async (req, res) => {
  try {
    const { studentId, classId } = req.body;
    if (!studentId || !classId)
      return res.status(400).json({ message: "Thiếu studentId hoặc classId" });

    const exists = await Enrollment.findOne({ studentId, classId });
    if (exists)
      return res.status(400).json({ message: "Sinh viên đã thuộc lớp này" });

    const newEnroll = await Enrollment.create({ studentId, classId });
    res.json(newEnroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ========== XOÁ 1 ENROLLMENT ========== */
export const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Enrollment.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy bản ghi" });
    res.json({ message: "Đã xoá thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ========== IMPORT DANH SÁCH TỪ EXCEL ========== */
// Dự kiến dùng multer + xlsx, viết trước khung
export const importEnrollments = async (req, res) => {
  try {
    // TODO: parse file Excel, mỗi dòng {studentCode, classCode}
    // => tìm userId, classId => insertMany unique
    res.json({ message: "Import enrollments - sẽ hoàn thiện sau" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
