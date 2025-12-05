// backend/controllers/studentAttendance.controller.js
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* Haversine */
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

export const studentCheckIn = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { attendanceId, gps } = req.body;

    if (!gps)
      return res.status(400).json({ message: "Không nhận được vị trí GPS" });

    const attendance = await Attendance.findById(attendanceId).populate(
      "classId"
    );

    if (!attendance)
      return res.status(404).json({ message: "QR không hợp lệ" });

    if (attendance.expireAt < new Date())
      return res.status(400).json({ message: "QR đã hết hạn" });

    const cls = attendance.classId;

    if (!cls.location?.lat || !cls.location?.lng)
      return res
        .status(400)
        .json({ message: "Lớp chưa thiết lập vị trí phòng học" });

    // Student must be in class
    if (!cls.students.map((id) => id.toString()).includes(studentId))
      return res.status(403).json({ message: "Bạn không thuộc lớp này" });

    // Already checked
    if (
      attendance.studentsPresent.find(
        (x) => x.studentId.toString() === studentId
      )
    ) {
      return res.status(400).json({ message: "Bạn đã điểm danh rồi" });
    }

    // GPS distance check
    const roomGPS = cls.location;
    let allowedRadius = cls.location.radius || 200;

    // Nếu accuracy kém → nới radius
    if (gps.accuracy > 50) allowedRadius = 600;

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

    // Save attendance
    attendance.studentsPresent.push({
      studentId,
      checkInTime: new Date(),
      gps,
      device: {
        userAgent: req.headers["user-agent"],
        platform: req.headers["sec-ch-ua-platform"],
      },
    });

    const totalStudents = cls.students.length;

    attendance.presentCount = attendance.studentsPresent.length;
    attendance.absentCount = totalStudents - attendance.presentCount;

    attendance.studentsAbsent = cls.students.filter(
      (id) =>
        !attendance.studentsPresent.some(
          (p) => p.studentId.toString() === id.toString()
        )
    );

    await attendance.save();

    return res.json({ message: "Điểm danh thành công" });
  } catch (err) {
    console.error("STUDENT CHECK-IN ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi điểm danh" });
  }
};
