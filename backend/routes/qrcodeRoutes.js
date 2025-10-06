import express from "express";
import { generateQRCode } from "../controllers/qrcodeController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Chỉ giảng viên mới được tạo QR code
router.post("/generate", protect(["teacher"]), generateQRCode);

export default router;
