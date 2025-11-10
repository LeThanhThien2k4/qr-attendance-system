import express from "express";
import {
  getNotifications,
  markNotificationRead,
  sendToUser,
  sendToMultiple,
} from "../controllers/notification.controller.js";
import  verifyToken  from "../middlewares/auth.js";
import  requireRole  from "../middlewares/role.js";

const router = express.Router();

// Người dùng xem thông báo của mình
router.get("/", verifyToken, getNotifications);

// Đánh dấu 1 thông báo là đã đọc
router.put("/:id/read", verifyToken, markNotificationRead);

// Admin gửi thông báo cho 1 người dùng
router.post("/send", verifyToken, requireRole("ADMIN"), sendToUser);

// Admin gửi thông báo cho nhiều người dùng
router.post("/send-bulk", verifyToken, requireRole("ADMIN"), sendToMultiple);

export default router;
