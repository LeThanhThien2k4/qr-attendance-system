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

    const attendance = await Attendance.findById(attendanceId)
      .populate("classId");

    if (!attendance)
      return res.status(404).json({ message: "QR không hợp lệ" });

    if (attendance.expireAt < new Date())
      return res.status(400).json({ message: "QR đã hết hạn" });

    const cls = attendance.classId;

    // MUST HAVE GPS ROOM
    if (!cls.location?.lat || !cls.location?.lng) {
      return res.status(400).json({ message: "Lớp chưa thiết lập GPS phòng học!" });
    }

    // CHECK student in class
    if (!cls.students.map(id => id.toString()).includes(studentId))
      return res.status(403).json({ message: "Bạn không thuộc lớp này" });

    // CHECK duplicated
    if (attendance.studentsPresent.find(x => x.studentId.toString() === studentId))
      return res.status(400).json({ message: "Bạn đã điểm danh rồi" });

    // GPS ROOM
    const teacherRoomGPS = {
      lat: cls.location.lat,
      lng: cls.location.lng,
    };

    const allowedRadius = cls.location.radius || 200;

    const dist = getDistance(
      gps.lat, gps.lng,
      teacherRoomGPS.lat, teacherRoomGPS.lng
    );

    if (dist > allowedRadius) {
      return res.status(400).json({
        message: `Bạn đang ở quá xa phòng học (> ${allowedRadius}m)`
      });
    }

    // SAVE
    attendance.studentsPresent.push({
      studentId,
      checkInTime: new Date(),
      gps,
      device: {
        userAgent: req.headers["user-agent"],
        platform: req.headers["sec-ch-ua-platform"],
      },
    });

    attendance.presentCount += 1;
    attendance.absentCount -= 1;

    attendance.studentsAbsent = attendance.studentsAbsent.filter(
      id => id.toString() !== studentId
    );

    await attendance.save();

    res.json({ message: "Điểm danh thành công" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
