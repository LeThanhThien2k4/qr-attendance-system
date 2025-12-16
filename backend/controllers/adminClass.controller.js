import Class from "../models/class.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Attendance from "../models/attendance.model.js";
/* ============================================================
   🟩 TẠO LỚP HỌC + NHẬN LUÔN SCHEDULE
============================================================ */
export const createClass = async (req, res) => {
  try {
    const { code, name, course, lecturer, semester, schedule } = req.body;

    // ==== Validate cơ bản ====
    if (!code?.trim()) return res.status(400).json({ message: "Vui lòng nhập mã lớp" });
    if (!name?.trim()) return res.status(400).json({ message: "Vui lòng nhập tên lớp" });
    if (!course) return res.status(400).json({ message: "Vui lòng chọn môn học" });
    if (!lecturer) return res.status(400).json({ message: "Vui lòng chọn giảng viên" });
    if (!semester?.trim()) return res.status(400).json({ message: "Vui lòng nhập học kỳ" });

    // ==== Check giảng viên ====
    const gv = await User.findById(lecturer);
    if (!gv || gv.role !== "lecturer") {
      return res.status(400).json({ message: "Giảng viên không hợp lệ" });
    }

    // ==== Check môn học ====
    const mh = await Course.findById(course);
    if (!mh)
      return res.status(400).json({ message: "Môn học không tồn tại" });

    // ==== Format schedule nếu có ====
    let formattedSchedule = [];
    if (Array.isArray(schedule)) {
      formattedSchedule = schedule.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        lesson: item.lesson,
        room: item.room,
        weeks: item.weeks || [],
      }));
    }

    // ==== Tạo lớp học phần ====
    const newClass = await Class.create({
      code: code.trim(),
      name: name.trim(),
      course,
      lecturer,
      semester: semester.trim(),
      schedule: formattedSchedule,
    });

    return res.status(201).json({
      message: "Tạo lớp học phần thành công",
      data: newClass,
    });
  } catch (err) {
    // Lỗi duplicate key
    if (err.code === 11000) {
      if (err.keyPattern?.code) {
        return res.status(400).json({ message: "Mã lớp đã tồn tại" });
      }
      return res.status(400).json({ message: "Lớp học phần này đã tồn tại" });
    }

    console.error("❌ CREATE CLASS ERROR:", err.message);
    return res.status(500).json({ message: "Không thể tạo lớp học phần" });
  }
};



/* ============================================================
   🟨 LẤY DANH SÁCH LỚP
============================================================ */
export const getClasses = async (req, res) => {
  try {
    let classes = await Class.find()
      .populate("course", "name")
      .populate("lecturer", "name email")
      .populate("students", "name email")  // populate để kiểm tra student còn tồn tại
      .lean();

    // 🔥 Lọc student NULL (đã bị xoá khỏi User DB)
    classes = classes.map(c => {
      const cleanStudents = (c.students || []).filter(s => s !== null);

      return {
        ...c,
        students: cleanStudents,           // FE sẽ nhận đúng số lượng
        studentCount: cleanStudents.length // nếu bạn muốn dùng field này
      };
    });

    return res.json(classes);
  } catch (err) {
    console.error("GET CLASSES ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};



/* ============================================================
   🟨 LẤY 1 LỚP THEO ID
============================================================ */
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const cls = await Class.findById(id)
      .populate("course", "name code")
      .populate("lecturer", "name email");

    if (!cls)
      return res.status(404).json({ message: "Không tìm thấy lớp học" });

    res.json(cls);
  } catch (err) {
    console.error("❌ GET CLASS BY ID ERROR:", err);
    res.status(500).json({ message: "Lỗi khi lấy thông tin lớp học" });
  }
};



/* ============================================================
   🟦 CẬP NHẬT LỚP + UPDATE SCHEDULE LUÔN
============================================================ */
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, course, lecturer, semester, schedule } = req.body;

    const cls = await Class.findById(id);
    if (!cls)
      return res.status(404).json({ message: "Không tìm thấy lớp học" });

    // Check duplicate code
    if (code) {
      const existed = await Class.findOne({ code, _id: { $ne: id } });
      if (existed)
        return res.status(400).json({ message: "Mã lớp đã tồn tại" });
    }

    // Update fields
    cls.code = code || cls.code;
    cls.name = name || cls.name;
    cls.course = course || cls.course;
    cls.lecturer = lecturer || cls.lecturer;
    cls.semester = semester || cls.semester;

    // ==== Update schedule nếu có ====
    if (Array.isArray(schedule)) {
      cls.schedule = schedule.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        lesson: item.lesson,
        room: item.room,
        weeks: item.weeks || [],
      }));
    }

    await cls.save();

    res.json({
      message: "Cập nhật lớp học phần thành công",
      data: cls,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Lớp học phần đã tồn tại" });
    }

    console.error("❌ UPDATE CLASS ERROR:", err);
    res.status(500).json({ message: "Lỗi cập nhật lớp học phần" });
  }
};



/* ============================================================
   🟥 XOÁ LỚP
============================================================ */
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Class.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy lớp học" });

    // 🔥 XÓA TOÀN BỘ ATTENDANCE CỦA LỚP
    await Attendance.deleteMany({ classId: id });

    return res.json({
      message: "Đã xoá lớp học và toàn bộ lịch sử điểm danh liên quan",
    });
  } catch (err) {
    console.error("❌ DELETE CLASS ERROR:", err);
    res.status(500).json({ message: "Lỗi khi xóa lớp học" });
  }
};



/* ============================================================
   ➕ THÊM SINH VIÊN VÀO LỚP
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

    if (!cls.students) cls.students = [];

    if (cls.students.includes(studentId)) {
      return res.status(400).json({ message: "Sinh viên đã có trong lớp" });
    }

    cls.students.addToSet(studentId);
    await cls.save();

    res.json({ message: "Thêm sinh viên thành công", students: cls.students });
  } catch (err) {
    console.error("❌ ADD STUDENT ERROR:", err);
    res.status(500).json({ message: "Không thể thêm sinh viên" });
  }
};



/* ============================================================
   ➖ XOÁ SINH VIÊN KHỎI LỚP
============================================================ */
export const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const cls = await Class.findById(classId);
    if (!cls)
      return res.status(404).json({ message: "Không tìm thấy lớp" });

    cls.students = cls.students.filter(
      (id) => id.toString() !== studentId.toString()
    );

    await cls.save();

    res.json({ message: "Đã xoá sinh viên", students: cls.students });
  } catch (err) {
    console.error("❌ REMOVE STUDENT ERROR:", err);
    res.status(500).json({ message: "Không thể xoá sinh viên" });
  }
};



/* ============================================================
   📌 LẤY DANH SÁCH SINH VIÊN TRONG LỚP
============================================================ */
export const getStudentsInClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const cls = await Class.findById(classId).populate(
      "students",
      "name email code"
    );

    if (!cls)
      return res.status(404).json({ message: "Không tìm thấy lớp" });

    res.json(cls.students);
  } catch (err) {
    console.error("❌ GET STUDENTS ERROR:", err);
    res.status(500).json({ message: "Không thể tải danh sách sinh viên" });
  }
};
