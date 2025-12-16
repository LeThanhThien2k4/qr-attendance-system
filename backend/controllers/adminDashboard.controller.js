import User from "../models/user.model.js";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* ====================================================================
   📊 ADMIN DASHBOARD CONTROLLER (PRODUCTION)
   - Filter theo năm (?year=)
   - Không gộp dữ liệu nhiều năm
   - Thống kê toàn hệ thống (Admin)
==================================================================== */
export const getAdminDashboardStats = async (req, res) => {
  try {
    /* ===================== 0. YEAR FILTER ===================== */
    const year = Number(req.query.year) || new Date().getFullYear();

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    /* ===================== 1. BASE STAGES ===================== */
    const baseStages = [
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: "$classInfo" },
    ];

    /* ===========================================================
       2. USERS STATS
    =========================================================== */
    const totalUsers = await User.countDocuments();

    const userByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    /* ===========================================================
       3. ATTENDANCE BY MONTH (12 MONTHS)
    =========================================================== */
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

    /* ===========================================================
       4. ATTENDANCE BY CLASS
    =========================================================== */
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

    /* ===========================================================
       5. ATTENDANCE SUMMARY
    =========================================================== */
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

    /* ===========================================================
       6. TOP ABSENT STUDENTS
    =========================================================== */
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

      // Join student
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },

      // Join class
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
              "-",
            ],
          },
          absentCount: 1,
        },
      },
    ]);

    /* ===========================================================
       7. SEND RESPONSE
    =========================================================== */
    res.json({
      year,
      totalUsers,
      userByRole,
      attendanceMonthly,
      attendanceByClass,
      attendanceSummary,
      topAbsentStudents,
    });
  } catch (err) {
    console.error("❌ Admin Dashboard Error:", err);
    res.status(500).json({
      message: "Lỗi khi tải dữ liệu Dashboard Admin",
    });
  }
};
