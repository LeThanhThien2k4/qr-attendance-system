// backend/controllers/studentAttendance.controller.js
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* ===========================================================
   HAVERSINE DISTANCE
=========================================================== */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ===========================================================
   STUDENT CHECK-IN (QR SCAN)
=========================================================== */
export const studentCheckIn = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { attendanceId, gps } = req.body;

    /* ================= VALIDATE INPUT ================= */
    if (!attendanceId)
      return res.status(400).json({ message: "Thiếu attendanceId" });

    if (!gps)
      return res.status(400).json({ message: "Không nhận được vị trí GPS" });

    /* ================= LOAD ATTENDANCE ================= */
    const attendance = await Attendance.findById(attendanceId).populate(
      "classId"
    );

    if (!attendance)
      return res.status(404).json({ message: "QR không hợp lệ" });

    if (attendance.expireAt < new Date())
      return res.status(400).json({ message: "QR đã hết hạn" });

    const cls = attendance.classId;

    /* ================= VALIDATE CLASS ================= */
    if (!cls)
      return res.status(400).json({ message: "Không tìm thấy lớp học" });

    if (!cls.location?.lat || !cls.location?.lng)
      return res
        .status(400)
        .json({ message: "Lớp chưa thiết lập vị trí phòng học" });

    /* ================= STUDENT IN CLASS ================= */
    const classStudentIds = cls.students.map((id) => id.toString());

    if (!classStudentIds.includes(studentId))
      return res.status(403).json({ message: "Bạn không thuộc lớp này" });

    /* ===================================================
       🔥 FIX QUAN TRỌNG – CLEAN DATA CŨ
       - Loại student đã bị xoá khỏi class
    =================================================== */
    attendance.studentsPresent = (attendance.studentsPresent || []).filter(
      (p) =>
        p?.studentId &&
        classStudentIds.includes(p.studentId.toString())
    );

    attendance.studentsAbsent = (attendance.studentsAbsent || []).filter(
      (id) => classStudentIds.includes(id.toString())
    );

    /* ================= ALREADY CHECKED ================= */
    if (
      attendance.studentsPresent.some(
        (p) => p.studentId.toString() === studentId
      )
    ) {
      return res.status(400).json({ message: "Bạn đã điểm danh rồi" });
    }

    /* ================= GPS CHECK ================= */
    const roomGPS = cls.location;
    let allowedRadius = roomGPS.radius || 200;

    if (gps.accuracy && gps.accuracy > 50) {
      allowedRadius = 600;
    }

    const dist = getDistance(
      Number(gps.lat),
      Number(gps.lng),
      Number(roomGPS.lat),
      Number(roomGPS.lng)
    );

    console.log("GPS distance:", dist, "accuracy:", gps.accuracy);

    if (dist > allowedRadius) {
      return res.status(400).json({
        message: `Bạn đang ở quá xa phòng học (> ${allowedRadius}m)`,
      });
    }

    /* ================= CHECK-IN ================= */
    attendance.studentsPresent.push({
      studentId,
      checkInTime: new Date(),
      gps,
      device: {
        userAgent: req.headers["user-agent"] || "",
        platform: req.headers["sec-ch-ua-platform"] || "",
      },
    });

    /* ================= REBUILD ABSENT LIST ================= */
    attendance.studentsAbsent = cls.students.filter(
      (id) =>
        !attendance.studentsPresent.some(
          (p) => p.studentId.toString() === id.toString()
        )
    );

    /* ================= UPDATE COUNTS ================= */
    attendance.presentCount = attendance.studentsPresent.length;
    attendance.absentCount = attendance.studentsAbsent.length;

    await attendance.save();

    return res.json({
      message: "Điểm danh thành công",
      presentCount: attendance.presentCount,
      absentCount: attendance.absentCount,
    });
  } catch (err) {
    console.error("STUDENT CHECK-IN ERROR:", err);
    return res
      .status(500)
      .json({ message: "Lỗi server khi điểm danh" });
  }
};
