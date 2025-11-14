import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import { studentCheckIn } from "../controllers/studentAttendance.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("student"));

router.post("/check-in", studentCheckIn);

export default router;
