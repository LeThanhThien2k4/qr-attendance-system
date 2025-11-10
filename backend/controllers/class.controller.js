import Class from "../models/class.model.js";

/**
 * Admin hoặc giảng viên tạo lớp học
 */
export const createClass = async (req, res) => {
  try {
    const c = await Class.create(req.body);
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy danh sách tất cả lớp học (admin)
 */
export const getClasses = async (req, res) => {
  const data = await Class.find()
    .populate("courseId", "name code")
    .populate("students", "fullName email");
  res.json(data);
};

/**
 * Admin thêm sinh viên vào lớp
 */
export const addStudentToClass = async (req, res) => {
  const { classId, studentId } = req.body;
  const cls = await Class.findById(classId);
  if (!cls.students.includes(studentId)) cls.students.push(studentId);
  await cls.save();
  res.json({ message: "Student added" });
};

/**
 * Giảng viên: lấy danh sách lớp mình phụ trách
 */
export const getMyClasses = async (req, res) => {
  const lecturerId = req.user.id;
  const classes = await Class.find({ lecturerId })
    .select("_id code name semester students");
  res.json(classes);
};
