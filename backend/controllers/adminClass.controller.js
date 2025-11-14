import Class from "../models/class.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import { getCurrentSemester } from "../utils/semesterHelper.js";

/* ============================================================
   🟩 TẠO LỚP HỌC
============================================================ */
export const createClass = async (req, res) => {
  try {
    const { code, name, course, lecturer, semester } = req.body;

    if (!name || !course || !lecturer || !semester) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Kiểm tra giảng viên có tồn tại và đúng role không
    const gv = await User.findById(lecturer);
    if (!gv || gv.role !== "lecturer") {
      return res.status(400).json({ message: "Giảng viên không hợp lệ" });
    }

    // Kiểm tra môn học tồn tại
    const mh = await Course.findById(course);
    if (!mh) return res.status(400).json({ message: "Môn học không tồn tại" });

    const newClass = await Class.create({
      code,
      name,
      course,
      lecturer,
      semester,
    });

    res.status(201).json({ message: "Tạo lớp học thành công", data: newClass });
  } catch (err) {
    // ✅ Nếu lỗi trùng khóa (duplicate key)
    if (err.code === 11000) {
      const dupKey = Object.keys(err.keyPattern || {})[0];

      if (dupKey === "code") {
        return res.status(400).json({
          message: "Mã lớp đã được sử dụng, vui lòng nhập mã khác",
          keyPattern: err.keyPattern,
        });
      }

      if (
        dupKey === "name" ||
        (err.keyPattern.name && err.keyPattern.course && err.keyPattern.semester)
      ) {
        return res.status(400).json({
          message: "Lớp học phần này đã tồn tại trong học kỳ này",
          keyPattern: err.keyPattern,
        });
      }

      return res.status(400).json({
        message: "Dữ liệu bị trùng lặp",
        keyPattern: err.keyPattern,
      });
    }

    console.error("❌ CREATE CLASS ERROR:", err);
    res.status(500).json({ message: "Lỗi khi tạo lớp học" });
  }
};

/* ============================================================
   🟨 LẤY DANH SÁCH TẤT CẢ LỚP
============================================================ */
export const getClasses = async (req, res) => {
  try {
    const list = await Class.find()
      .populate("course", "name code")
      .populate("lecturer", "name email")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("❌ GET CLASSES ERROR:", err);
    res.status(500).json({ message: "Không thể tải danh sách lớp học" });
  }
};

/* ============================================================
   🟨 LẤY THÔNG TIN 1 LỚP
============================================================ */
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id)
      .populate("course", "name code")
      .populate("lecturer", "name email");

    if (!cls) return res.status(404).json({ message: "Không tìm thấy lớp học" });

    res.json(cls);
  } catch (err) {
    console.error("❌ GET CLASS BY ID ERROR:", err);
    res.status(500).json({ message: "Lỗi khi lấy thông tin lớp học" });
  }
};

/* ============================================================
   🟦 CẬP NHẬT LỚP HỌC
============================================================ */
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, course, lecturer, semester } = req.body;

    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ message: "Không tìm thấy lớp học" });

    // Kiểm tra trùng mã lớp khác id hiện tại
    if (code) {
      const existed = await Class.findOne({ code, _id: { $ne: id } });
      if (existed)
        return res.status(400).json({
          message: "Mã lớp đã được sử dụng, vui lòng nhập mã khác",
        });
    }

    cls.code = code || cls.code;
    cls.name = name || cls.name;
    cls.course = course || cls.course;
    cls.lecturer = lecturer || cls.lecturer;
    cls.semester = semester || cls.semester;

    await cls.save();
    res.json({ message: "Cập nhật lớp học thành công", data: cls });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Lớp học phần này đã tồn tại trong học kỳ này",
      });
    }

    console.error("❌ UPDATE CLASS ERROR:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật lớp học" });
  }
};

/* ============================================================
   🟥 XÓA LỚP HỌC
============================================================ */
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Class.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy lớp học" });

    res.json({ message: "Đã xóa lớp học" });
  } catch (err) {
    console.error("❌ DELETE CLASS ERROR:", err);
    res.status(500).json({ message: "Lỗi khi xóa lớp học" });
  }
};

/* ============================================================
   ➕ THÊM SINH VIÊN VÀO LỚP HỌC PHẦN
============================================================ */
export const addStudentToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Không tìm thấy lớp" });

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(400).json({ message: "Sinh viên không hợp lệ" });
    }

    if (cls.students.includes(studentId)) {
      return res.status(400).json({ message: "Sinh viên đã có trong lớp" });
    }

    cls.students.push(studentId);
    await cls.save();

    res.json({ message: "Thêm sinh viên thành công", students: cls.students });
  } catch (err) {
    console.error("❌ addStudentToClass:", err);
    res.status(500).json({ message: "Lỗi khi thêm sinh viên" });
  }
};

/* ============================================================
   ➖ XOÁ SINH VIÊN KHỎI LỚP
============================================================ */
export const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Không tìm thấy lớp" });

    cls.students = cls.students.filter(
      (id) => id.toString() !== studentId.toString()
    );

    await cls.save();

    res.json({ message: "Đã xoá sinh viên", students: cls.students });
  } catch (err) {
    console.error("❌ removeStudentFromClass:", err);
    res.status(500).json({ message: "Lỗi khi xoá sinh viên" });
  }
};

export const getStudentsInClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const cls = await Class.findById(classId).populate(
      "students",
      "name email code"
    );

    if (!cls) return res.status(404).json({ message: "Không tìm thấy lớp" });

    res.json(cls.students);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi tải danh sách sinh viên" });
  }
};
