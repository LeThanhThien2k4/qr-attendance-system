import express from "express";
import {
  createClass,
  getClasses,
  addStudentToClass,
  getMyClasses,
} from "../controllers/class.controller.js";
import  verifyToken  from "../middlewares/auth.js";
import  requireRole  from "../middlewares/role.js";

const router = express.Router();

// Admin hoặc giảng viên tạo lớp học
router.post("/", verifyToken, (req, res, next) => {
  if (!["ADMIN", "LECTURER"].includes(req.user.role))
    return res.status(403).json({ message: "Unauthorized" });
  next();
}, createClass);

// Admin xem tất cả lớp học
router.get("/", verifyToken, requireRole("ADMIN"), getClasses);

// Admin thêm sinh viên vào lớp
router.post("/add-student", verifyToken, requireRole("ADMIN"), addStudentToClass);

// Giảng viên lấy danh sách lớp của mình
router.get("/my", verifyToken, requireRole("LECTURER"), getMyClasses);

export default router;
