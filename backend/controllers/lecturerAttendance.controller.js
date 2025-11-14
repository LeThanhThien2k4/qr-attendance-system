// backend/controllers/lecturerAttendance.controller.js
import QRCode from "qrcode";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* ============================================================
   🧮 HÀM TÍNH KHOẢNG CÁCH GPS (Haversine)
============================================================ */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // mét
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ============================================================
   🟩 1. GIẢNG VIÊN TẠO QR ĐIỂM DANH
============================================================ */
export const lecturerCreateAttendance = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId } = req.body;

    const cls = await Class.findById(classId).populate("students", "_id");
    if (!cls) return res.status(404).json({ message: "Lớp không tồn tại" });

    if (cls.lecturer.toString() !== lecturerId)
      return res.status(403).json({ message: "Bạn không phụ trách lớp này" });

    // Kiểm tra lớp đã đặt GPS phòng học chưa
    if (!cls.location?.lat || !cls.location?.lng) {
      return res.status(400).json({
        message:
          "Lớp học chưa thiết lập vị trí phòng học. Vui lòng đặt GPS trước.",
      });
    }

    const now = new Date();
    const expireAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 phút

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

/* ============================================================
   🟧 2. GIẢNG VIÊN – XEM LỊCH SỬ ĐIỂM DANH
============================================================ */
export const lecturerGetAttendances = async (req, res) => {
  try {
    const lecturerId = req.user.id;

    const list = await Attendance.find({ lecturerId })
      .populate("classId", "name code semester")
      .sort({ date: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Không thể tải danh sách" });
  }
};

/* ============================================================
   🟦 3. GIẢNG VIÊN – XEM CHI TIẾT BUỔI ĐIỂM DANH
============================================================ */
export const lecturerGetAttendanceDetail = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { id } = req.params;

    const att = await Attendance.findById(id)
      .populate("classId", "name code semester")
      .populate("studentsPresent.studentId", "name code email")
      .populate("studentsAbsent", "name code email");

    if (!att)
      return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });

    if (att.lecturerId.toString() !== lecturerId)
      return res.status(403).json({ message: "Không có quyền truy cập" });

    res.json(att);
  } catch (err) {
    res.status(500).json({ message: "Không thể tải chi tiết" });
  }
};

/* ============================================================
   🟪 4. GIẢNG VIÊN – LẤY LỚP ĐANG PHỤ TRÁCH
============================================================ */
export const lecturerGetMyClasses = async (req, res) => {
  try {
    const lecturerId = req.user.id;

    const classes = await Class.find({ lecturer: lecturerId }).populate(
      "course",
      "name code"
    );

    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Không thể tải lớp học phần" });
  }
};

/* ============================================================
   🟫 5. CẬP NHẬT GPS PHÒNG HỌC
============================================================ */
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
      radius: radius || 200,
    };

    await cls.save();

    res.json({
      message: "Đã cập nhật vị trí phòng học",
      location: cls.location,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
