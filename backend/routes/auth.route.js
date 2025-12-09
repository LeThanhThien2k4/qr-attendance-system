import express from "express";
import { login, forgotPasswordRequestOTP, forgotPasswordVerifyOTP } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);

// 🔥 QUÊN MẬT KHẨU – KHÔNG CẦN TOKEN
router.post("/forgot-password/request-otp", forgotPasswordRequestOTP);
router.post("/forgot-password/verify", forgotPasswordVerifyOTP);

export default router;
