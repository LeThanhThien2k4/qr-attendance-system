import Class from "../models/class.model.js";
import AttendanceSession from "../models/attendanceSession.model.js";
import AttendanceRecord from "../models/attendanceRecord.model.js";

/**
 * === Dashboard giảng viên ===
 * GET /api/lecturer/dashboard
 */
export const getLecturerDashboard = async (req, res) => {
  try {
    const lecturerId = req.user.id;

    // 1️⃣ Tổng lớp phụ trách
    const classes = await Class.find({ lecturerId }).populate("students");
    const totalClasses = classes.length;

    // 2️⃣ Tổng số sinh viên
    const totalStudents = new Set(
      classes.flatMap((c) => c.students.map((s) => s.toString()))
    ).size;

    // 3️⃣ Tổng số buổi học
    const sessions = await AttendanceSession.find({ lecturerId });
    const totalSessions = sessions.length;

    // 4️⃣ Tính tỉ lệ điểm danh trung bình
    const records = await AttendanceRecord.find({
      sessionId: { $in: sessions.map((s) => s._id) },
    });

    const presentCount = records.filter((r) => r.status === "PRESENT").length;
    const totalCount = records.length || 1;
    const attendanceRate = Math.round((presentCount / totalCount) * 100);

    // 5️⃣ Buổi học gần nhất
    const recentSessions = await Promise.all(
      sessions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(async (s) => {
          const cls = classes.find(
            (c) => c._id.toString() === s.classId.toString()
          );
          const recs = records.filter(
            (r) => r.sessionId.toString() === s._id.toString()
          );
          const present = recs.filter((r) => r.status === "PRESENT").length;
          const total = recs.length || 1;
          return {
            _id: s._id,
            className: cls ? cls.name : "Không xác định",
            date: s.date,
            presentCount: present,
            rate: Math.round((present / total) * 100),
          };
        })
    );

    res.json({
      totalClasses,
      totalStudents,
      totalSessions,
      attendanceRate,
      recentSessions,
    });
  } catch (err) {
    console.error("❌ getLecturerDashboard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
