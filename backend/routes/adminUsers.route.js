import express from "express";
import multer from "multer"; // ✅ Cần thiết để định nghĩa upload
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";

import {
  createUser,
  getUsers,
  deleteUser,
  updateUser,
  importUsers,
  exportUsers,
} from "../controllers/adminUser.controller.js";

const router = express.Router();

// ✅ Cấu hình multer (đặt TRƯỚC khi gọi router.post)
const upload = multer({ dest: "uploads/" });

// ✅ Chỉ ADMIN mới được thao tác user
router.use(verifyToken, requireRole("admin"));

// === CRUD người dùng ===
router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// === Import / Export Excel ===
router.post("/import", upload.single("file"), importUsers); // POST /admin/users/import?role=student
router.get("/export", exportUsers); // GET /admin/users/export?role=lecturer

export default router;
