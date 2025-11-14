import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";

import {
  getAttendances,
  resetAttendance,
  deleteAttendance
} from "../controllers/adminAttendance.controller.js";

const router = express.Router();

// Admin chỉ được xem/reset/xóa
router.use(verifyToken, requireRole("admin"));

router.get("/", getAttendances);
router.put("/:id/reset", resetAttendance);
router.delete("/:id", deleteAttendance);

export default router;
