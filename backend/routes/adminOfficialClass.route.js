// backend/routes/adminOfficialClass.route.js
import express from "express";
import multer from "multer";        // ❗ dùng multer đúng chuẩn
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";

import {
  getOfficialClasses,
  createOfficialClass,
  updateOfficialClass,
  deleteOfficialClass,
  addStudentToClass,
  removeStudentFromClass,
  importClassStudents,
  exportClassStudents,
  getOfficialClassById,
} from "../controllers/adminOfficialClass.controller.js";

const router = express.Router();

// ❗ Khai báo multer TẠI ĐÂY – không import folder uploads
const upload = multer({ dest: "uploads/" });

// ---- Middleware bảo vệ ----
router.use(verifyToken, requireRole("admin"));

// ---- CRUD lớp chính quy ----
router.get("/", getOfficialClasses);
router.post("/", createOfficialClass);
router.put("/:id", updateOfficialClass);
router.delete("/:id", deleteOfficialClass);

// ---- Thêm / Xóa sinh viên thủ công ----
router.post("/:id/students", addStudentToClass);
router.delete("/:id/students/:studentId", removeStudentFromClass);
router.get("/:id", getOfficialClassById);


// ---- Import / Export sinh viên ----
router.post(
  "/:id/students/import",
  upload.single("file"), 
  importClassStudents
);

router.get("/:id/students/export", exportClassStudents);

export default router;
