// backend/controllers/lecturerDashboard.controller.js
import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

export const getLecturerDashboardStats = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const lecturerObjectId = new mongoose.Types.ObjectId(lecturerId);

    /* ============================================================
       0. LẤY DANH SÁCH LỚP HỢP LỆ (KHÔNG CÒN RÁC)
    ============================================================ */
    const validClasses = await Class.find({ lecturer: lecturerObjectId })
      .select("_id code name")
      .lean();

    const validClassIds = validClasses.map((c) => c._id);

    // Nếu giảng viên không còn lớp → trả data rỗng sạch
    if (validClassIds.length === 0) {
      return res.json({
        summary: {
          totalClasses: 0,
          totalSessions: 0,
          totalPresent: 0,
          totalAbsent: 0,
          attendanceRate: 0,
        },
        todaySessions: [],
        recentAttendances: [],
        classStats: [],
        lowAttendanceClasses: [],
      });
    }

    /* ============================================================
       1. TỔNG QUAN
    ============================================================ */
    const summaryAgg = await Attendance.aggregate([
      {
        $match: {
          lecturerId: lecturerObjectId,
          classId: { $in: validClassIds }, // CHẶN DỮ LIỆU RÁC
        },
      },
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

    const summary = {
      totalClasses: validClasses.length,
      totalSessions: summaryRaw.totalSessions,
      totalPresent: summaryRaw.totalPresent,
      totalAbsent: summaryRaw.totalAbsent,
      attendanceRate:
        totalSlots > 0
          ? Number(((summaryRaw.totalPresent / totalSlots) * 100).toFixed(1))
          : 0,
    };

    /* ============================================================
       2. BUỔI ĐIỂM DANH HÔM NAY
    ============================================================ */
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todaySessions = await Attendance.find({
      lecturerId: lecturerObjectId,
      classId: { $in: validClassIds }, // CHẶN RÁC
      date: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate("classId", "code name")
      .sort({ date: -1 })
      .lean();

    /* ============================================================
       3. LỊCH SỬ ĐIỂM DANH GẦN NHẤT
    ============================================================ */
const recentAttendances = await Attendance.aggregate([
  {
    $match: {
      lecturerId: lecturerObjectId,
      classId: { $in: validClassIds },
    },
  },

  { $sort: { date: -1 } },
  { $limit: 10 },

  // JOIN CLASS
  {
    $lookup: {
      from: "classes",
      localField: "classId",
      foreignField: "_id",
      as: "classInfo",
    },
  },
  { $unwind: "$classInfo" },

  // rosterIds = classInfo.students (ObjectId[])
  {
    $addFields: {
      rosterIds: {
        $map: {
          input: { $ifNull: ["$classInfo.students", []] },
          as: "sid",
          in: "$$sid",
        },
      },

      // presentIds = studentsPresent.studentId  (QUAN TRỌNG)
      presentIds: {
        $map: {
          input: { $ifNull: ["$studentsPresent", []] },
          as: "p",
          in: "$$p.studentId",
        },
      },
    },
  },

  // activeRoster: student isActive=true
  {
    $lookup: {
      from: "users",
      let: { roster: "$rosterIds" },
      pipeline: [
        { $match: { $expr: { $in: ["$_id", "$$roster"] } } },
        { $match: { role: "student", isActive: true } },
        { $project: { _id: 1 } },
      ],
      as: "activeRoster",
    },
  },

  // activePresent: student isActive=true
  {
    $lookup: {
      from: "users",
      let: { present: "$presentIds" },
      pipeline: [
        { $match: { $expr: { $in: ["$_id", "$$present"] } } },
        { $match: { role: "student", isActive: true } },
        { $project: { _id: 1 } },
      ],
      as: "activePresent",
    },
  },

  // recalc counts
  {
    $addFields: {
      presentCount: { $size: "$activePresent" },
      totalCount: { $size: "$activeRoster" },
    },
  },
  {
    $addFields: {
      absentCount: {
        $max: [0, { $subtract: ["$totalCount", "$presentCount"] }],
      },
    },
  },

  // shape output giống UI đang dùng
  {
    $project: {
      _id: 1,
      date: 1,
      presentCount: 1,
      absentCount: 1,
      classId: {
        _id: "$classInfo._id",
        code: "$classInfo.code",
        name: "$classInfo.name",
      },
    },
  },
]);
    /* ============================================================
       4. THỐNG KÊ THEO LỚP
    ============================================================ */
    const classStats = await Attendance.aggregate([
      {
        $match: {
          lecturerId: lecturerObjectId,
          classId: { $in: validClassIds }, // CHẶN RÁC
        },
      },
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
              { $gt: [{ $add: ["$totalPresent", "$totalAbsent"] }, 0] },
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

    /* ============================================================
       5. LỚP CÓ CHUYÊN CẦN THẤP
    ============================================================ */
    const lowAttendanceClasses = classStats.filter(
      (c) => c.attendanceRate < 60
    );

    /* ============================================================
       TRẢ VỀ KẾT QUẢ
    ============================================================ */
    return res.json({
      summary,
      todaySessions,
      recentAttendances,
      classStats,
      lowAttendanceClasses,
    });
  } catch (err) {
    console.error("❌ Lecturer Dashboard Error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi khi tải thống kê giảng viên" });
  }
};
