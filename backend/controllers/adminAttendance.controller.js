import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* =======================
   Utils
======================= */
const toObjectId = (id) => {
  if (!id) return null;
  return mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : null;
};

/* ===========================================================
   GET /admin/attendances
=========================================================== */
export const getAttendances = async (req, res) => {
  try {
    const { classId, lecturerId, courseId, from, to } = req.query;

    const classObjId = toObjectId(classId);
    const lecturerObjId = toObjectId(lecturerId);
    const courseObjId = toObjectId(courseId);

    /* =======================
       BASE MATCH (Attendance)
    ======================= */
    const match = {};

    if (classObjId) {
      match.classId = classObjId;
    }

    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) match.date.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    /* =======================
       PIPELINE
    ======================= */
    const pipeline = [{ $match: match }];

    /* ===== JOIN CLASS ===== */
    pipeline.push(
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: "$classInfo" }
    );

    /* ===== FILTER COURSE ===== */
    if (!classObjId && courseObjId) {
      pipeline.push({
        $match: { "classInfo.course": courseObjId },
      });
    }

    /* ===== FILTER LECTURER ===== */
    if (lecturerObjId) {
      pipeline.push({
        $match: { "classInfo.lecturer": lecturerObjId },
      });
    }

    /* ===== JOIN COURSE ===== */
    pipeline.push(
      {
        $lookup: {
          from: "courses",
          localField: "classInfo.course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: { path: "$courseInfo", preserveNullAndEmptyArrays: true } }
    );

    /* ===== JOIN LECTURER ===== */
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "classInfo.lecturer",
          foreignField: "_id",
          as: "lecturerInfo",
        },
      },
      { $unwind: { path: "$lecturerInfo", preserveNullAndEmptyArrays: true } }
    );

    /* ===== STUDENT COUNTS ===== */
    pipeline.push(
      {
        $addFields: {
          rosterIds: { $ifNull: ["$classInfo.students", []] },
          presentIds: {
            $map: {
              input: { $ifNull: ["$studentsPresent", []] },
              as: "p",
              in: "$$p.studentId",
            },
          },
        },
      },

      {
        $lookup: {
          from: "users",
          let: { ids: "$rosterIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
            { $match: { role: "student", isActive: true } },
            { $project: { _id: 1 } },
          ],
          as: "activeRoster",
        },
      },

      {
        $lookup: {
          from: "users",
          let: { ids: "$presentIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
            { $match: { role: "student", isActive: true } },
            { $project: { _id: 1 } },
          ],
          as: "activePresent",
        },
      },

      {
        $addFields: {
          presentCount: { $size: "$activePresent" },
          totalCount: { $size: "$activeRoster" },
          absentCount: {
            $max: [
              0,
              { $subtract: [{ $size: "$activeRoster" }, { $size: "$activePresent" }] },
            ],
          },
        },
      }
    );

    /* ===== SLOT FALLBACK ===== */
    pipeline.push({
      $addFields: {
        week: { $ifNull: ["$slot.week", "--"] },
        lesson: { $ifNull: ["$slot.lesson", "--"] },
        room: { $ifNull: ["$slot.room", "--"] },
      },
    });

    /* ===== SORT ===== */
    pipeline.push({ $sort: { date: -1 } });

    /* ===== RESPONSE SHAPE ===== */
    pipeline.push({
      $project: {
        _id: 1,
        date: 1,
        qrLink: 1,
        week: 1,
        lesson: 1,
        room: 1,
        presentCount: 1,
        absentCount: 1,
        classId: {
          _id: "$classInfo._id",
          name: "$classInfo.name",
          code: "$classInfo.code",
          course: {
            _id: "$courseInfo._id",
            name: "$courseInfo.name",
            code: "$courseInfo.code",
          },
          lecturer: {
            _id: "$lecturerInfo._id",
            name: "$lecturerInfo.name",
            email: "$lecturerInfo.email",
          },
        },
      },
    });

    const list = await Attendance.aggregate(pipeline);
    return res.json(list);
  } catch (err) {
    console.error("GET ATTENDANCES ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/* ===========================================================
   RESET ATTENDANCE
=========================================================== */
export const resetAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const att = await Attendance.findById(id);
    if (!att) {
      return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });
    }

    att.studentsPresent = [];
    att.studentsAbsent = [];
    await att.save();

    return res.json({ message: "Đã reset buổi điểm danh" });
  } catch (err) {
    console.error("RESET ATTENDANCE ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/* ===========================================================
   DELETE ATTENDANCE
=========================================================== */
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Attendance.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });
    }

    return res.json({ message: "Đã xóa buổi điểm danh" });
  } catch (err) {
    console.error("DELETE ATTENDANCE ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
