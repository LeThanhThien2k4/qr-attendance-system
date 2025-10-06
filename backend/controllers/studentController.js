import Student from "../models/Student.js";

// 🟢 Lấy danh sách sinh viên
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Thêm sinh viên
export const createStudent = async (req, res) => {
  const { mssv, hoten, lop, khoa, email } = req.body;
  try {
    const existing = await Student.findOne({ mssv });
    if (existing) return res.status(400).json({ message: "MSSV đã tồn tại" });

    const newStudent = new Student({ mssv, hoten, lop, khoa, email });
    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Lấy chi tiết 1 sinh viên
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Cập nhật sinh viên
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Xóa sinh viên
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    res.json({ message: "Đã xóa sinh viên" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
