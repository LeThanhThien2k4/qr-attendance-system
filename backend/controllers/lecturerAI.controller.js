import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";
import { analyzeAttendanceWithGemini } from "../services/gemini.service.js";

/**
 * AI / Rule-based phân tích xu hướng vắng học theo LỚP
 * - Ưu tiên Gemini
 * - Fallback rule-based khi hết quota
 */
export const lecturerAnalyzeAttendanceAI = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId } = req.query;

    if (!classId) {
      return res.status(400).json({ message: "Missing classId" });
    }

    /* =====================================================
     * 1. CHECK CLASS + OWNERSHIP
     * ===================================================== */
    const cls = await Class.findById(classId)
      .populate("students", "name email")
      .lean();

    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (cls.lecturer.toString() !== lecturerId) {
      return res.status(403).json({ message: "Not your class" });
    }

    /* =====================================================
     * 2. LOAD ATTENDANCE HISTORY (ONLY THIS CLASS)
     * ===================================================== */
    const attendances = await Attendance.find({ classId })
      .sort({ date: 1 })
      .lean();

    if (!attendances.length) {
      return res.json({
        source: "none",
        classRisk: "LOW",
        summary: "Chưa có dữ liệu điểm danh để phân tích.",
        students: [],
        recommendations: [],
      });
    }

    /* =====================================================
     * 3. BUILD PER-STUDENT DATASET (STRICT BY CLASS)
     * ===================================================== */
    const payload = cls.students.map((student) => {
      const history = attendances.map((a) => {
        const isPresent = a.studentsPresent?.some(
          (p) => p.studentId?.toString() === student._id.toString()
        );

        const isAbsent = a.studentsAbsent?.some(
          (id) => id.toString() === student._id.toString()
        );

        // Chỉ tính buổi có trạng thái rõ ràng
        if (isPresent) {
          return { date: a.date, status: "PRESENT" };
        }

        if (isAbsent) {
          return { date: a.date, status: "ABSENT" };
        }

        // Không có record rõ → bỏ qua (tránh sai dữ liệu)
        return null;
      }).filter(Boolean);

      const totalSessions = history.length;
      const presentCount = history.filter(h => h.status === "PRESENT").length;
      const absentCount  = history.filter(h => h.status === "ABSENT").length;

      return {
        studentId: student._id.toString(),
        name: student.name,
        email: student.email,
        totalSessions,
        presentCount,
        absentCount,
        absentRate: totalSessions > 0 ? absentCount / totalSessions : 0,
        history,
      };
    });

    /* =====================================================
     * 4. TRY GEMINI AI
     * ===================================================== */
    try {
      const aiResult = await analyzeAttendanceWithGemini(payload);
      return res.json({
        source: "gemini",
        ...aiResult,
      });
    } catch (aiErr) {
      console.warn("⚠ Gemini unavailable → fallback rule-based");
    }

    /* =====================================================
     * 5. FALLBACK RULE-BASED (SAFE & LOGICAL)
     * ===================================================== */

    // ✔ Chỉ xét SV có đủ dữ liệu (>= 3 buổi)
    const riskyStudents = payload.filter(
      (s) => s.totalSessions >= 3 && s.absentRate >= 0.3
    );

    let classRisk = "LOW";
    if (riskyStudents.length >= payload.length * 0.3) {
      classRisk = "HIGH";
    } else if (riskyStudents.length > 0) {
      classRisk = "MEDIUM";
    }

    return res.json({
      source: "rule-based",
      classRisk,
      summary:
        "AI không khả dụng do giới hạn quota. Kết quả được suy luận bằng thống kê lịch sử điểm danh theo lớp.",
      students: riskyStudents.map((s) => ({
        studentId: s.studentId,
        name: s.name,
        risk: s.absentRate >= 0.5 ? "HIGH" : "MEDIUM",
        probability: Math.round(s.absentRate * 100),
        reason: `Vắng ${s.absentCount}/${s.totalSessions} buổi`,
      })),
      recommendations: [
        "Liên hệ trực tiếp sinh viên có tỉ lệ vắng cao",
        "Nhắc nhở qua LMS hoặc email",
        "Theo dõi thêm 2–3 buổi tiếp theo",
      ],
    });
  } catch (err) {
    console.error("AI CONTROLLER ERROR:", err);
    res.status(500).json({ message: "AI analysis failed" });
  }
};
