import express from "express";
import {
  requestOTP,
  verifyOTP,
  resetPassword,
} from "../controllers/passwordReset.controller.js";

const router = express.Router();

router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset", resetPassword);

export default router;
