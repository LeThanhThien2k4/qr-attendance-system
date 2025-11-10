import express from "express";
import multer from "multer";
import {
  createUser,
  getUsers,
  getUserBySlug,
  importUsers,
  getUserStats,
  getMe,
} from "../controllers/user.controller.js";
import  verifyToken from "../middlewares/auth.js";
import  requireRole from "../middlewares/role.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// === Admin tạo 1 user thủ công ===
router.post("/", verifyToken, requireRole("ADMIN"), createUser);

// === Admin import nhiều user từ Excel ===
router.post(
  "/import",
  verifyToken,
  requireRole("ADMIN"),
  upload.single("file"),
  importUsers
);

// === Lấy thông tin user hiện tại (cho FE hiển thị header) ===
router.get("/me", verifyToken, getMe);

// === Lấy danh sách user ===
router.get("/", verifyToken, requireRole("ADMIN"), getUsers);

// === Lấy thông tin user theo slug ===
router.get("/slug/:slug", verifyToken, getUserBySlug);

// === Thống kê người dùng ===
router.get("/stats", verifyToken, requireRole("ADMIN"), getUserStats);

export default router;
