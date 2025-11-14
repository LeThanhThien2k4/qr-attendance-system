
import Class from "../models/class.model.js";
import { verifyQrToken, createQrToken } from "../services/qrService.js";
import { calcDistance } from "../services/gpsService.js";
import { predictAbsenceAI } from "../services/aiService.js";
import {
  sendNotification,
  sendBulkNotification,
} from "../services/notificationService.js";
import QRCode from "qrcode";

/**
 * === Giảng viên tạo buổi học (sinh QR) ===
 */
export const createSession = async (req, res) => {
  try {
    const { classId, date, gpsLocation } = req.body;

    // 1. Tạo session
    const session = await AttendanceSession.create({
      classId,
      date,
      lecturerId: req.user.id,
      gpsLocation,
    });

    // 2. Tạo token + QR base64
    const qrToken = createQrToken({
      sessionId: session._id.toString(),
      classId,
      date,
    });
    session.qrCode = qrToken;
    await session.save();

    const qrDataUrl = await QRCode.toDataURL(qrToken);

    // 3. Gửi thông báo đến sinh viên
    const cls = await Class.findById(classId).populate("students");
    const studentIds = cls.students.map((s) => s._id);

    await sendBulkNotification(
      studentIds,
      "Buổi học mới",
      `Giảng viên ${req.user.fullName} đã tạo buổi học ngày ${new Date(
        date
      ).toLocaleDateString()}. Vui lòng điểm danh đúng giờ.`,
      "INFO"
    );

    res.json({
      success: true,
      message: "Tạo buổi học thành công",
      session,
      qrDataUrl,
    });
  } catch (err) {
    console.error("❌ createSession error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * === Sinh viên điểm danh ===
 */
export const checkIn = async (req, res) => {
  try {
    const { qr, coords } = req.body;
    const decoded = verifyQrToken(qr);
    const session = await AttendanceSession.findById(decoded.sessionId);
    if (!session)
      return res.status(404).json({ message: "Buổi học không tồn tại" });

    const distance = calcDistance(coords, session.gpsLocation);
    const studentId = req.user.id;

    let status = "PRESENT";
    let note = "";

    if (distance > session.gpsLocation.radius) {
      status = "ABSENT";
      note = "Điểm danh ngoài khu vực cho phép";
      await sendNotification(
        studentId,
        "Điểm danh không hợp lệ",
        "Bạn đã điểm danh ngoài khu vực lớp học. Hệ thống ghi nhận là vắng học.",
        "ALERT"
      );
    }

    const record = await AttendanceRecord.create({
      sessionId: session._id,
      studentId,
      status,
      gpsData: coords,
      checkInTime: new Date(),
      note,
      distance, // thêm để hiển thị FE
    });

    // === Gọi AI dự đoán nghỉ học ===
    try {
      const probability = await predictAbsenceAI({
        studentId,
        courseId: session.classId,
      });

      if (probability >= 0.7) {
        await sendNotification(
          studentId,
          "Cảnh báo nguy cơ nghỉ học",
          `Hệ thống AI dự đoán bạn có ${Math.round(
            probability * 100
          )}% khả năng vắng học trong thời gian tới.`,
          "REMINDER"
        );
      }
    } catch (e) {
      console.warn("⚠️ AI service unreachable:", e.message);
    }

    res.json({
      success: true,
      message: "Điểm danh thành công",
      status,
      distance,
      record,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * === Giảng viên xem danh sách điểm danh theo buổi học ===
 */
export const getSessionRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await AttendanceSession.findById(id)
      .populate({
        path: "classId",
        populate: { path: "students", select: "fullName email studentCode" },
      })
      .populate("lecturerId", "fullName email");

    if (!session)
      return res.status(404).json({ message: "Buổi học không tồn tại" });

    const records = await AttendanceRecord.find({ sessionId: id })
      .populate("studentId", "fullName studentCode email")
      .lean();

    res.json({
      success: true,
      session,
      records,
    });
  } catch (err) {
    console.error("❌ getSessionRecords error:", err.message);
    res.status(500).json({
      success: false,
      message: "Không thể tải danh sách điểm danh",
    });
  }
};
