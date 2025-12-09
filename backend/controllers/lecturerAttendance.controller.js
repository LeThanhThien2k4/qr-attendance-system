// backend/controllers/lecturerAttendance.controller.js
import QRCode from "qrcode";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* ===========================================================
   HÀM TÍNH KHOẢNG CÁCH (nếu cần dùng sau)
   ==========================================================*/
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
   1) GIẢNG VIÊN CẬP NHẬT GPS PHÒNG HỌC
   ==========================================================*/
export const lecturerSetClassLocation = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId, lat, lng, radius, accuracy } = req.body;
    
    console.log("GIẢNG VIÊN GPS:", { lat, lng, accuracy });


    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Lớp không tồn tại" });

    if (cls.lecturer.toString() !== lecturerId)
      return res.status(403).json({ message: "Bạn không phụ trách lớp này" });

    cls.location = {
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius) || 200,
      accuracy: Number(accuracy) || null
    };

    await cls.save();

    return res.json({
      message: "Đã cập nhật vị trí phòng học",
      location: cls.location,
      accuracyReceived: accuracy,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================================================
   2) GIẢNG VIÊN TẠO QR ĐIỂM DANH
   ==========================================================*/
export const lecturerCreateAttendance = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId } = req.body;

    const cls = await Class.findById(classId).populate("students", "_id");
    if (!cls) return res.status(404).json({ message: "Lớp không tồn tại" });

    if (cls.lecturer.toString() !== lecturerId) {
      return res.status(403).json({ message: "Bạn không phụ trách lớp này" });
    }

    if (
      !cls.location ||
      typeof cls.location.lat !== "number" ||
      typeof cls.location.lng !== "number"
    ) {
      return res.status(400).json({
        message: "Vui lòng cập nhật GPS phòng học trước khi tạo QR.",
      });
    }

    const now = new Date();
    const expireAt = new Date(now.getTime() + 60 * 1000); // 60s

    // Tìm phiên còn hạn hiện tại (nếu có)
    let attendance = await Attendance.findOne({
      classId,
      lecturerId,
      expireAt: { $gt: now },
    });

    if (!attendance) {
      // Chưa có => tạo mới
      attendance = await Attendance.create({
        classId,
        lecturerId,
        date: now,
        expireAt,
        studentsPresent: [],
        studentsAbsent: cls.students.map((s) => s._id),
        presentCount: 0,
        absentCount: cls.students.length,
      });
    }

    const payload = {
      attendanceId: attendance._id,
      classId,
      lecturerId,
      expireAt: expireAt.getTime(),
    };

    const qrLink = await QRCode.toDataURL(JSON.stringify(payload));

    attendance.expireAt = expireAt;
    attendance.qrLink = qrLink;
    await attendance.save();

    const json = attendance.toObject();
    json.qrLink = qrLink;
    json.expireAt = expireAt;
    json.attendanceId = attendance._id;

    return res.json(json);
  } catch (err) {
    console.error("lecturerCreateAttendance ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


/* ===========================================================
   3) LẤY DANH SÁCH LỚP GIẢNG VIÊN PHỤ TRÁCH
   ==========================================================*/
export const lecturerGetMyClasses = async (req, res) => {
  try {
    const lecturerId = req.user.id;

    const classes = await Class.find({ lecturer: lecturerId })
      .populate("course", "name")
      .populate("students", "_id")
      .lean(); // tránh mất field trong JSON

    return res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================================================
   4) LỊCH SỬ ĐIỂM DANH CỦA GIẢNG VIÊN
   ==========================================================*/
export const lecturerGetAttendances = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId } = req.query;

    const filter = { lecturerId };

    if (classId) {
      filter.classId = classId;
    }

    const attendances = await Attendance.find(filter)
      .populate({
    path: "classId",
    select: "name code course",
    populate: {
      path: "course",
      select: "name"
    }
      })
      .sort({ date: -1 })
      .lean();

    const formatted = attendances.map(att => ({
      ...att,
      date: att.date || att.createdAt || null
    }));

    return res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================================================
   5) CHI TIẾT BUỔI ĐIỂM DANH
   ==========================================================*/
export const lecturerGetAttendanceDetail = async (req, res) => {
  try {
    
    const { id } = req.params;

    const att = await Attendance.findById(id)
      .populate("studentsAbsent", "name studentId")
      .populate("studentsPresent.studentId", "name studentId");

    if (!att) return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });

    return res.json({
      present: att.studentsPresent.map((s) => ({
        _id: s.studentId._id,
        studentId: s.studentId.studentId,
        name: s.studentId.name,
        checkInTime: s.checkInTime,
      })),
      absent: att.studentsAbsent.map((s) => ({
        _id: s._id,
        studentId: s.studentId,
        name: s.name,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ===========================================================
   6) GIẢNG VIÊN CẬP NHẬT THỦ CÔNG DANH SÁCH SINH VIÊN
   ==========================================================*/

export const lecturerManualUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { presentIds } = req.body; 
    // Lưu ý: presentIds = [studentId, studentId, ...]

    const att = await Attendance.findById(id);

    if (!att) return res.status(404).json({ message: "Buổi điểm danh không tồn tại" });

    // Thu thập tất cả sinh viên (present + absent)
    const allStudents = [
      ...att.studentsAbsent.map(s => s.toString()),
      ...att.studentsPresent.map(s => s.studentId.toString()),
    ];

    // Xác định sinh viên có mặt mới
    const newPresent = presentIds;

    // Xác định sinh viên vắng: all trừ present
    const newAbsent = allStudents.filter(id => !newPresent.includes(id));

    // Build lại studentsPresent giữ metadata cũ nếu có
    const rebuiltPresent = newPresent.map(id => {
      const existing = att.studentsPresent.find(p => p.studentId.toString() === id);
      return existing
        ? existing
        : { studentId: id, checkInTime: null };
    });

    att.studentsPresent = rebuiltPresent;
    att.studentsAbsent = newAbsent;
    att.presentCount = rebuiltPresent.length;
    att.absentCount = newAbsent.length;

    await att.save();

    return res.json({
      success: true,
      presentCount: att.presentCount,
      absentCount: att.absentCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================================================
   7) GIẢNG VIÊN KẾT THÚC PHIÊN ĐIỂM DANH
   ==========================================================*/
export const lecturerEndAttendanceSession = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { attendanceId } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance)
      return res.status(404).json({ message: "Không tìm thấy phiên điểm danh" });

    if (attendance.lecturerId.toString() !== lecturerId)
      return res.status(403).json({ message: "Bạn không phụ trách phiên này" });

    // 🔥 KẾT THÚC PHIÊN NGAY LẬP TỨC
    attendance.expireAt = new Date(); // hết hạn ngay lập tức
    await attendance.save();

    return res.json({ message: "Đã kết thúc phiên điểm danh", attendanceId : attendance._id, });
  } catch (err) {
    console.error("END SESSION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
