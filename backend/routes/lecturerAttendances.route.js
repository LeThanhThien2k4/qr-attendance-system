import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import {
  lecturerCreateAttendance,
  lecturerSetClassLocation,
  lecturerGetMyClasses,
  lecturerGetAttendances,
  lecturerGetAttendanceDetail,
  lecturerManualUpdate,
  lecturerEndAttendanceSession
} from "../controllers/lecturerAttendance.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("lecturer"));

// ⭐ LẤY DANH SÁCH LỚP
router.get("/classes", lecturerGetMyClasses);

// ⭐ LỊCH SỬ ĐIỂM DANH
router.get("/attendances", lecturerGetAttendances);

// ⭐ TẠO QR
router.post("/", lecturerCreateAttendance);

// ⭐ CẬP NHẬT GPS
router.post("/set-location", lecturerSetClassLocation);

router.get("/attendance/:id/detail", lecturerGetAttendanceDetail);
router.patch("/attendance/:id/manual-update", lecturerManualUpdate);

router.post("/end-session", lecturerEndAttendanceSession);
export default router;
