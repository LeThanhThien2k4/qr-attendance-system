// backend/controllers/lecturerAttendance.controller.js
import QRCode from "qrcode";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* Haversine */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lat2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ===========================================================
   GIẢNG VIÊN ĐẶT GPS PHÒNG HỌC
=============================================================*/
export const lecturerSetClassLocation = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId, lat, lng, radius } = req.body;

    const cls = await Class.findById(classId);

    if (!cls) return res.status(404).json({ message: "Lớp không tồn tại" });

    if (cls.lecturer.toString() !== lecturerId)
      return res.status(403).json({ message: "Bạn không phụ trách lớp này" });

    cls.location = {
      lat,
      lng,
      radius: radius || 200, // default 200m
    };

    await cls.save();

    return res.json({
      message: "Đã cập nhật vị trí phòng học",
      location: cls.location,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================================================
   TẠO QR ĐIỂM DANH
=============================================================*/
export const lecturerCreateAttendance = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId } = req.body;

    const cls = await Class.findById(classId).populate("students", "_id");

    if (!cls) return res.status(404).json({ message: "Lớp không tồn tại" });

    if (cls.lecturer.toString() !== lecturerId)
      return res.status(403).json({ message: "Bạn không phụ trách lớp này" });

    if (!cls.location || typeof cls.location.lat !== "number" || typeof cls.location.lng !== "number") {
  return res.status(400).json({
    message: "Vui lòng cập nhật vị trí phòng học trước khi tạo QR.",
  });
}


    const now = new Date();
    const expireAt = new Date(now.getTime() + 5 * 60 * 1000);

    const attendance = await Attendance.create({
      classId,
      lecturerId,
      date: now,
      expireAt,
      studentsPresent: [],
      studentsAbsent: cls.students.map((s) => s._id),
      presentCount: 0,
      absentCount: cls.students.length,
    });

    const payload = {
      attendanceId: attendance._id,
      classId,
      lecturerId,
      expireAt: expireAt.getTime(),
    };

    const qrLink = await QRCode.toDataURL(JSON.stringify(payload));
    attendance.qrLink = qrLink;
    await attendance.save();

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
