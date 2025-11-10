import express from "express";
import verifyToken from "../middlewares/auth.js";
import {
  getEnrollmentsByClass,
  addEnrollment,
  deleteEnrollment,
  importEnrollments,
} from "../controllers/enrollment.controller.js";

const router = express.Router();

// middleware xác thực
router.use(verifyToken);

// lấy danh sách sinh viên trong lớp
router.get("/", getEnrollmentsByClass);

// thêm thủ công 1 bản ghi
router.post("/", addEnrollment);

// xoá bản ghi
router.delete("/:id", deleteEnrollment);

// import danh sách từ Excel
router.post("/import", importEnrollments);

export default router;
