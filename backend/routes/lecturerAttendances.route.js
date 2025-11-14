// backend/routes/lecturerAttendances.route.js
import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";

import {
  lecturerCreateAttendance,
  lecturerGetAttendances,
  lecturerGetAttendanceDetail,
    lecturerGetMyClasses,
    lecturerSetClassLocation,
} from "../controllers/lecturerAttendance.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("lecturer"));

// ⭐ ĐÚNG THỨ TỰ — static → list → dynamic
router.get("/classes", lecturerGetMyClasses);
router.get("/", lecturerGetAttendances);
router.get("/:id", lecturerGetAttendanceDetail);

// Tạo QR
router.post("/", lecturerCreateAttendance);

router.post("/set-location", lecturerSetClassLocation);

export default router;
