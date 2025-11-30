// backend/controllers/lecturerDashboard.controller.js
import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

export const getLecturerDashboardStats = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const lecturerObjectId = new mongoose.Types.ObjectId(lecturerId);

    /* ==========================================
       1. TỔNG QUAN
    ========================================== */
    const totalClasses = await Class.countDocuments({ lecturer: lecturerObjectId });

    const summaryAgg = await Attendance.aggregate([
      { $match: { lecturerId: lecturerObjectId } },
      {
        $group: {
          _id: null,
          totalPresent: { $sum: "$presentCount" },
          totalAbsent: { $sum: "$absentCount" },
          totalSessions: { $sum: 1 },
        },
      },
    ]);

    const summaryRaw =
      summaryAgg.length > 0
        ? summaryAgg[0]
        : { totalPresent: 0, totalAbsent: 0, totalSessions: 0 };

    const totalSlots = summaryRaw.totalPresent + summaryRaw.totalAbsent;
    const attendanceRate =
      totalSlots > 0
        ? Number(((summaryRaw.totalPresent / totalSlots) * 100).toFixed(1))
        : 0;

    const summary = {
      totalClasses,
      totalSessions: summaryRaw.totalSessions,
      totalPresent: summaryRaw.totalPresent,
      totalAbsent: summaryRaw.totalAbsent,
      attendanceRate,
    };

    /* ==========================================
       2. BUỔI ĐIỂM DANH HÔM NAY
    ========================================== */
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todaySessions = await Attendance.find({
      lecturerId: lecturerObjectId,
      date: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate("classId", "code name")
      .sort({ date: -1 })
      .lean();

    /* ==========================================
       3. LỊCH SỬ ĐIỂM DANH GẦN NHẤT
    ========================================== */
    const recentAttendances = await Attendance.find({
      lecturerId: lecturerObjectId,
    })
      .populate("classId", "code name")
      .sort({ date: -1 })
      .limit(10)
      .lean();

    /* ==========================================
       4. THỐNG KÊ THEO LỚP
    ========================================== */
    const classStats = await Attendance.aggregate([
      { $match: { lecturerId: lecturerObjectId } },
      {
        $group: {
          _id: "$classId",
          totalPresent: { $sum: "$presentCount" },
          totalAbsent: { $sum: "$absentCount" },
          sessions: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: "$classInfo" },
      {
        $project: {
          classId: "$_id",
          classCode: "$classInfo.code",
          className: "$classInfo.name",
          totalPresent: 1,
          totalAbsent: 1,
          sessions: 1,
          attendanceRate: {
            $cond: [
              {
                $gt: [
                  { $add: ["$totalPresent", "$totalAbsent"] },
                  0,
                ],
              },
              {
                $multiply: [
                  {
                    $divide: [
                      "$totalPresent",
                      { $add: ["$totalPresent", "$totalAbsent"] },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { classCode: 1 } },
    ]);

    /* ==========================================
       5. CÁC LỚP CÓ CHUYÊN CẦN THẤP (< 60%)
    ========================================== */
    const lowAttendanceClasses = classStats.filter(
      (c) => c.attendanceRate < 60
    );

    return res.json({
      summary,
      todaySessions,
      recentAttendances,
      classStats,
      lowAttendanceClasses,
    });
  } catch (err) {
    console.error("❌ Lecturer Dashboard Error:", err);
    res.status(500).json({ message: "Lỗi khi tải thống kê giảng viên" });
  }
};
