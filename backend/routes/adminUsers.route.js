import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js"; // thêm dòng này
import {
  createUser,
  getUsers,
  deleteUser,
  updateUser, // thêm update để dùng trong PUT
} from "../controllers/adminUser.controller.js";

const router = express.Router();

// Chỉ ADMIN mới được thao tác user
router.use(verifyToken, requireRole("ADMIN"));

// === CRUD người dùng ===
router.get("/", getUsers);               // Lấy danh sách
router.post("/", createUser);            // Tạo người dùng
router.put("/:id", updateUser);          // Cập nhật người dùng
router.delete("/:id", deleteUser);       // Xóa người dùng

export default router;
