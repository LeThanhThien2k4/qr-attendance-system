import Class from "../models/Class.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";

// 🟢 Lấy danh sách lớp
export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("giangvien", "hoten email")
      .populate("sinhviens", "hoten mssv lop khoa");
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Tạo lớp học
export const createClass = async (req, res) => {
  try {
    const { tenlop, malop, monhoc, giangvienId } = req.body;

    const teacher = await Teacher.findById(giangvienId);
    if (!teacher) return res.status(404).json({ message: "Không tìm thấy giảng viên" });

    const newClass = new Class({
      tenlop,
      malop,
      monhoc,
      giangvien: giangvienId,
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Thêm sinh viên vào lớp
export const addStudentToClass = async (req, res) => {
  try {
    const { classId, studentId } = req.body;

    const lop = await Class.findById(classId);
    const student = await Student.findById(studentId);

    if (!lop || !student) return res.status(404).json({ message: "Không tìm thấy lớp hoặc sinh viên" });

    if (lop.sinhviens.includes(studentId))
      return res.status(400).json({ message: "Sinh viên đã có trong lớp" });

    lop.sinhviens.push(studentId);
    await lop.save();

    res.json({ message: "Đã thêm sinh viên vào lớp", lop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟢 Lấy chi tiết 1 lớp
export const getClassById = async (req, res) => {
  try {
    const lop = await Class.findById(req.params.id)
      .populate("giangvien", "hoten email")
      .populate("sinhviens", "hoten mssv lop khoa");

    if (!lop) return res.status(404).json({ message: "Không tìm thấy lớp" });
    res.json(lop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
