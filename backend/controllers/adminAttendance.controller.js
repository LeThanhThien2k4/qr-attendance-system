import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

// === Lấy danh sách điểm danh (có filter) ===
export const getAttendances = async (req, res) => {
  try {
    const { classId, lecturerId, courseId, from, to } = req.query;

    let query = {};

    // 1) Giảng viên
    if (lecturerId) query.lecturerId = lecturerId;

    // 2) Nếu chọn classId → ưu tiên tuyệt đối
    if (classId) {
      query.classId = classId;
    }

    // 3) Nếu không chọn classId mà chọn courseId → lọc theo môn
    else if (courseId) {
      const classList = await Class.find({ course: courseId }).select("_id");

      query.classId = {
        $in: classList.map(c => c._id.toString())
      };
    }

    // 4) Lọc theo ngày
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const list = await Attendance.find(query)
      .populate({
        path: "classId",
        populate: [
          { path: "course", select: "name code" },
          { path: "lecturer", select: "name email" }
        ]
      })
      .sort({ date: -1 });

    res.json(list);

  } catch (err) {
    console.error("GET ATTENDANCES ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};


// === RESET buổi điểm danh ===
export const resetAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const att = await Attendance.findById(id);
    if (!att) return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });

    att.presentCount = 0;
    att.absentCount = 0;
    att.studentsPresent = [];
    att.studentsAbsent = [];
    await att.save();

    res.json({ message: "Đã reset buổi điểm danh" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// === Xóa buổi điểm danh ===
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Attendance.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });

    res.json({ message: "Đã xóa buổi điểm danh" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
