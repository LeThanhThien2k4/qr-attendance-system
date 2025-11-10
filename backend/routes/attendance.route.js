import express from "express";
import {
  createSession,
  checkIn,
  getSessionRecords,
} from "../controllers/attendance.controller.js";
import  verifyToken  from "../middlewares/auth.js";
import  requireRole  from "../middlewares/role.js";

const router = express.Router();

// Giảng viên tạo buổi học
router.post("/session", verifyToken, requireRole("LECTURER"), createSession);

// Sinh viên điểm danh
router.post("/checkin", verifyToken, requireRole("STUDENT"), checkIn);

// Giảng viên xem danh sách điểm danh
router.get("/session/:id", verifyToken, requireRole("LECTURER"), getSessionRecords);

export default router;
