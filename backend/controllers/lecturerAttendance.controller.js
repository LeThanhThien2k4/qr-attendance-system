import QRCode from "qrcode";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

/* ===========================================================
   1) GIẢNG VIÊN CẬP NHẬT GPS PHÒNG HỌC
=========================================================== */
export const lecturerSetClassLocation = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId, lat, lng, radius, accuracy } = req.body;

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Lớp không tồn tại" });

    if (cls.lecturer.toString() !== lecturerId) {
      return res.status(403).json({ message: "Bạn không phụ trách lớp này" });
    }

    cls.location = {
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius) || 200,
      accuracy: accuracy != null ? Number(accuracy) : null,
    };

    await cls.save();

    return res.json({
      message: "Đã cập nhật vị trí phòng học",
      location: cls.location,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ===========================================================
   2) GIẢNG VIÊN TẠO / LÀM MỚI QR (FIX LẶP PHIÊN)
=========================================================== */
export const lecturerCreateAttendance = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId, scheduleIndex, week } = req.body;

    /* ---------- VALIDATE ---------- */
    if (!classId)
      return res.status(400).json({ message: "Thiếu classId" });

    if (
      scheduleIndex === undefined ||
      scheduleIndex === null ||
      Number.isNaN(Number(scheduleIndex))
    ) {
      return res.status(400).json({ message: "Thiếu buổi học (scheduleIndex)" });
    }

    if (!week)
      return res.status(400).json({ message: "Thiếu tuần học" });

    /* ---------- LOAD CLASS ---------- */
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

    const idx = Number(scheduleIndex);
    const scheduleItem =
      Array.isArray(cls.schedule) && cls.schedule.length > idx
        ? cls.schedule[idx]
        : null;

    if (!scheduleItem) {
      return res.status(400).json({ message: "Buổi học không hợp lệ" });
    }

    /* =======================================================
       🔑 FIX QUAN TRỌNG: TÌM PHIÊN THEO (TUẦN + BUỔI)
    ======================================================= */
    const now = new Date();
    const expireAt = new Date(now.getTime() + 60 * 1000); // 60s

    let attendance = await Attendance.findOne({
      classId,
      lecturerId,
      "slot.week": Number(week),
      "slot.lesson": idx + 1,
      expireAt: { $gt: now }, // chỉ lấy phiên CHƯA HẾT HẠN
    });

    /* ---------- KHÔNG CÓ → TẠO PHIÊN MỚI ---------- */
    if (!attendance) {
      attendance = new Attendance({
        classId,
        lecturerId,
        date: now,
        expireAt,
        slot: {
          week: Number(week),
          lesson: idx + 1,
          room: scheduleItem.room || "",
        },
        studentsPresent: [],
        studentsAbsent: cls.students.map((s) => s._id),
        presentCount: 0,
        absentCount: cls.students.length,
      });
    }
    /* ---------- CÓ → CHỈ REFRESH QR ---------- */
    else {
      attendance.date = now;
      attendance.expireAt = expireAt;
    }

    /* ---------- QR ---------- */
    const payload = {
      attendanceId: attendance._id,
      classId,
      lecturerId,
      expireAt: expireAt.getTime(),
    };

    const qrLink = await QRCode.toDataURL(JSON.stringify(payload));
    attendance.qrLink = qrLink;

    await attendance.save();

    return res.json({
      attendanceId: attendance._id,
      qrLink,
      expireAt,
    });
  } catch (err) {
    console.error("lecturerCreateAttendance ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ===========================================================
   3) LẤY DANH SÁCH LỚP GIẢNG VIÊN PHỤ TRÁCH
=========================================================== */
export const lecturerGetMyClasses = async (req, res) => {
  try {
    const lecturerId = req.user.id;

    const classes = await Class.find({ lecturer: lecturerId })
      .populate("course", "name")
      .populate("students", "_id")
      .lean();

    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ===========================================================
   4) LỊCH SỬ ĐIỂM DANH
=========================================================== */
export const lecturerGetAttendances = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { classId } = req.query;

    const filter = {
      lecturerId,
      classId: { $exists: true, $ne: null },
    };
    if (classId) filter.classId = classId;

    const attendances = await Attendance.find(filter)
      .populate({
        path: "classId",
        select: "name code course",
        populate: { path: "course", select: "name" },
      })
      .populate("studentsPresent.studentId", "_id")
      .populate("studentsAbsent", "_id")
      .sort({ date: -1 })
      .lean();

    const formatted = attendances.map((att) => {
      const validPresent = (att.studentsPresent || []).filter(
        (p) => p.studentId
      );

      const validAbsent = (att.studentsAbsent || []).filter(
        (s) => s && s._id
      );

      return {
        _id: att._id,
        classId: att.classId,
        date: att.date || att.createdAt || null,
        expireAt: att.expireAt || null,
        presentCount: validPresent.length,
        absentCount: validAbsent.length,
        slot: att.slot || {},
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error("lecturerGetAttendances ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};


/* ===========================================================
   5) CHI TIẾT BUỔI ĐIỂM DANH
=========================================================== */
export const lecturerGetAttendanceDetail = async (req, res) => {
  try {
    const att = await Attendance.findById(req.params.id)
      .populate("studentsPresent.studentId", "name email")
      .populate("studentsAbsent", "name email")
      .lean();

    if (!att)
      return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });

    att.studentsPresent = (att.studentsPresent || []).map((p) => ({
      studentId: p.studentId?._id || null,
      name: p.studentId?.name || "Đã xoá khỏi hệ thống",
      email: p.studentId?.email || "",
      checkInTime: p.checkInTime || null,
      gps: p.gps || null,
    }));

    att.studentsAbsent = (att.studentsAbsent || []).map((s) => ({
      studentId: s?._id || null,
      name: s?.name || "Đã xoá khỏi hệ thống",
      email: s?.email || "",
    }));

    return res.json(att);
  } catch (err) {
    console.error("lecturerGetAttendanceDetail ERROR:", err);
    return res
      .status(500)
      .json({ message: "Lỗi server khi tải chi tiết điểm danh" });
  }
};

/* ===========================================================
   6) GIẢNG VIÊN KẾT THÚC PHIÊN
=========================================================== */
export const lecturerEndAttendanceSession = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { attendanceId } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance)
      return res.status(404).json({ message: "Không tìm thấy phiên điểm danh" });

    if (attendance.lecturerId.toString() !== lecturerId) {
      return res.status(403).json({ message: "Bạn không phụ trách phiên này" });
    }

    attendance.expireAt = new Date();
    await attendance.save();

    return res.json({
      message: "Đã kết thúc phiên điểm danh",
      attendanceId: attendance._id,
    });
  } catch (err) {
    console.error("END SESSION ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
export const lecturerManualUpdate = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { id } = req.params;
    const { presentIds } = req.body; // array studentId

    if (!Array.isArray(presentIds)) {
      return res.status(400).json({ message: "presentIds không hợp lệ" });
    }

    const attendance = await Attendance.findById(id).populate("classId");
    if (!attendance) {
      return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });
    }

    if (attendance.lecturerId.toString() !== lecturerId) {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa buổi này" });
    }

    const cls = attendance.classId;
    if (!cls) {
      return res.status(400).json({ message: "Lớp học không tồn tại" });
    }

    // ===== Danh sách SV hiện tại của lớp (nguồn sự thật) =====
    const classStudentIds = cls.students.map((s) => s.toString());

    // ===== Lọc presentIds hợp lệ =====
    const validPresentIds = presentIds.filter((sid) =>
      classStudentIds.includes(sid)
    );

    // ===== Build studentsPresent =====
    attendance.studentsPresent = validPresentIds.map((sid) => {
      const existed = attendance.studentsPresent.find(
        (p) => p.studentId?.toString() === sid
      );

      return (
        existed || {
          studentId: sid,
          checkInTime: null,
        }
      );
    });

    // ===== Build studentsAbsent =====
    attendance.studentsAbsent = classStudentIds.filter(
      (sid) => !validPresentIds.includes(sid)
    );

    // ===== Update counts =====
    attendance.presentCount = attendance.studentsPresent.length;
    attendance.absentCount = attendance.studentsAbsent.length;

    await attendance.save();

    return res.json({
      success: true,
      presentCount: attendance.presentCount,
      absentCount: attendance.absentCount,
    });
  } catch (err) {
    console.error("lecturerManualUpdate ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
