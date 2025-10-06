import express from "express";
import {
  generateQRCode,
  markAttendance,
  getAttendanceByClass,
} from "../controllers/attendanceController.js";

const router = express.Router();

// Giảng viên tạo QR
router.post("/generate", generateQRCode);

// Sinh viên quét QR để điểm danh
router.post("/mark", markAttendance);

// Giảng viên xem danh sách điểm danh theo lớp
router.get("/:classId", getAttendanceByClass);

export default router;
