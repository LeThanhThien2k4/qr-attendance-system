import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import {
  lecturerCreateAttendance,
  lecturerSetClassLocation,
  lecturerGetMyClasses,
  lecturerGetAttendances,
} from "../controllers/lecturerAttendance.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("lecturer"));

// ⭐ LẤY DANH SÁCH LỚP
router.get("/classes", lecturerGetMyClasses);

// ⭐ LỊCH SỬ ĐIỂM DANH
router.get("/", lecturerGetAttendances);

// ⭐ TẠO QR
router.post("/", lecturerCreateAttendance);

// ⭐ CẬP NHẬT GPS
router.post("/set-location", lecturerSetClassLocation);

export default router;
