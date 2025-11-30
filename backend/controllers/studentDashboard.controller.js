// backend/controllers/studentDashboard.controller.js
import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/* ============================================================
   📌 STUDENT DASHBOARD
   - Tổng quan lớp đang học, số buổi, có mặt / vắng
   - Thống kê theo từng lớp
   - Lịch sử điểm danh gần đây
   - Buổi điểm danh trong ngày
============================================================ */
export const getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentObjId = toObjectId(studentId);

    /* 1. Lớp đang học */
    const myClasses = await Class.find({ students: studentObjId }).select(
      "_id code name course"
    );

    const totalClasses = myClasses.length;

    /* 2. Thống kê theo lớp (classStats) */
    const classStats = await Attendance.aggregate([
      {
        $match: {
          $or: [
            { "studentsPresent.studentId": studentObjId },
            { studentsAbsent: studentObjId },
          ],
        },
      },
      {
        $addFields: {
          isPresent: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$studentsPresent",
                    as: "sp",
                    cond: { $eq: ["$$sp.studentId", studentObjId] },
                  },
                },
              },
              0,
            ],
          },
          isAbsent: { $in: [studentObjId, "$studentsAbsent"] },
        },
      },
      {
        $group: {
          _id: "$classId",
          totalSessions: { $sum: 1 },
          present: { $sum: { $cond: ["$isPresent", 1, 0] } },
          absent: { $sum: { $cond: ["$isAbsent", 1, 0] } },
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
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "courses",
          localField: "classInfo.course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: { path: "$courseInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          classId: "$_id",
          className: "$classInfo.code",
          courseName: "$courseInfo.name",
          totalSessions: 1,
          present: 1,
          absent: 1,
          attendanceRate: {
            $cond: [
              { $gt: [{ $add: ["$present", "$absent"] }, 0] },
              {
                $multiply: [
                  {
                    $divide: ["$present", { $add: ["$present", "$absent"] }],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { className: 1 } },
    ]);

    // Tính tổng từ classStats
    let totalSessions = 0;
    let presentTotal = 0;
    let absentTotal = 0;

    classStats.forEach((c) => {
      totalSessions += c.totalSessions || 0;
      presentTotal += c.present || 0;
      absentTotal += c.absent || 0;
    });

    /* 3. Lịch sử điểm danh gần đây (recentAttendances) */
    const recentAttendances = await Attendance.aggregate([
      {
        $match: {
          $or: [
            { "studentsPresent.studentId": studentObjId },
            { studentsAbsent: studentObjId },
          ],
        },
      },
      { $sort: { date: -1 } },
      { $limit: 10 },
      {
        $addFields: {
          isPresent: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$studentsPresent",
                    as: "sp",
                    cond: { $eq: ["$$sp.studentId", studentObjId] },
                  },
                },
              },
              0,
            ],
          },
          isAbsent: { $in: [studentObjId, "$studentsAbsent"] },
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
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "courses",
          localField: "classInfo.course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: { path: "$courseInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          date: "$date",
          className: "$classInfo.code",
          courseName: "$courseInfo.name",
          status: {
            $cond: [
              "$isPresent",
              "present",
              {
                $cond: ["$isAbsent", "absent", "unknown"],
              },
            ],
          },
        },
      },
    ]);

    /* 4. Buổi điểm danh hôm nay (todaySessions) */
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySessions = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfToday, $lte: endOfToday },
          $or: [
            { "studentsPresent.studentId": studentObjId },
            { studentsAbsent: studentObjId },
          ],
        },
      },
      {
        $addFields: {
          isPresent: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$studentsPresent",
                    as: "sp",
                    cond: { $eq: ["$$sp.studentId", studentObjId] },
                  },
                },
              },
              0,
            ],
          },
          isAbsent: { $in: [studentObjId, "$studentsAbsent"] },
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
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "courses",
          localField: "classInfo.course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: { path: "$courseInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          date: "$date",
          className: "$classInfo.code",
          courseName: "$courseInfo.name",
          status: {
            $cond: [
              "$isPresent",
              "present",
              {
                $cond: ["$isAbsent", "absent", "unknown"],
              },
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return res.json({
      totalClasses,
      totalSessions,
      presentTotal,
      absentTotal,
      classStats,
      recentAttendances,
      todaySessions,
    });
  } catch (err) {
    console.error("❌ Student Dashboard Error:", err);
    res
      .status(500)
      .json({ message: "Lỗi khi tải thống kê dashboard sinh viên" });
  }
};
