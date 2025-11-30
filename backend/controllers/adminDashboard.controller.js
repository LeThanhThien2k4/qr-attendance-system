import User from "../models/user.model.js";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* ====================================================================
   📌 ADMIN DASHBOARD — FIXED VERSION
   - Chỉ tính điểm danh của giảng viên hiện tại của lớp
   - Không cộng dồn buổi cũ của giảng viên trước đó
   - Không sai số Top Vắng Nhất
   - Không sai Summary
==================================================================== */
export const getAdminDashboardStats = async (req, res) => {
  try {
    /* ----------------- BASE STAGES ----------------- */
    const baseStages = [
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: "$classInfo" },

      // Chỉ tính attendance mà lecturerId = lecturer hiện tại
      {
        $match: {
          $expr: { $eq: ["$lecturerId", "$classInfo.lecturer"] },
        },
      },
    ];

    /* =======================================================
       1. Tổng user + phân loại theo role
    ======================================================= */
    const totalUsers = await User.countDocuments();

    const userByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    /* =======================================================
       2. Thống kê theo tháng
    ======================================================= */
    const attendanceMonthly = await Attendance.aggregate([
      ...baseStages,
      {
        $group: {
          _id: { $month: "$date" },
          present: { $sum: "$presentCount" },
          absent: { $sum: "$absentCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    /* =======================================================
       3. Thống kê theo lớp
    ======================================================= */
    const attendanceByClass = await Attendance.aggregate([
      ...baseStages,
      {
        $group: {
          _id: "$classId",
          present: { $sum: "$presentCount" },
          absent: { $sum: "$absentCount" },
          classInfo: { $first: "$classInfo" },
        },
      },
      {
        $project: {
          className: "$classInfo.code",
          present: 1,
          absent: 1,
        },
      },
      { $sort: { className: 1 } },
    ]);

    /* =======================================================
       4. Summary (Tổng vắng / tổng có mặt)
    ======================================================= */
    const summaryRaw = await Attendance.aggregate([
      ...baseStages,
      {
        $group: {
          _id: null,
          present: { $sum: "$presentCount" },
          absent: { $sum: "$absentCount" },
        },
      },
    ]);

    const attendanceSummary =
      summaryRaw.length > 0
        ? summaryRaw[0]
        : { present: 0, absent: 0 };

    /* =======================================================
       5. Top Sinh viên vắng nhiều nhất
    ======================================================= */
    const topAbsentStudents = await Attendance.aggregate([
      ...baseStages,
      { $unwind: "$studentsAbsent" },

      {
        $group: {
          _id: "$studentsAbsent",
          absentCount: { $sum: 1 },
          classes: { $addToSet: "$classId" },
        },
      },

      { $sort: { absentCount: -1 } },
      { $limit: 10 },

      // Join User
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },

      // Join Class
      {
        $lookup: {
          from: "classes",
          localField: "classes",
          foreignField: "_id",
          as: "cls",
        },
      },

      {
        $project: {
          name: "$student.name",
          email: "$student.email",
          className: {
            $cond: [
              { $gt: [{ $size: "$cls" }, 0] },
              { $arrayElemAt: ["$cls.code", 0] },
              "-"
            ],
          },
          absentCount: 1,
        },
      },
    ]);

    /* =======================================================
       📌 SEND FINAL RESPONSE
    ======================================================= */
    res.json({
      totalUsers,
      userByRole,
      attendanceMonthly,
      attendanceByClass,
      attendanceSummary,
      topAbsentStudents,
    });
  } catch (err) {
    console.error("❌ Admin Dashboard Error:", err);
    res.status(500).json({ message: "Lỗi khi tải thống kê Dashboard" });
  }
};
