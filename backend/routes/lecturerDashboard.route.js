// backend/routes/lecturerDashboard.route.js
import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import { getLecturerDashboardStats } from "../controllers/lecturerDashboard.controller.js";

const router = express.Router();

// Chỉ cho lecturer
router.use(verifyToken, requireRole("lecturer"));

// GET /api/lecturer/dashboard
router.get("/dashboard", getLecturerDashboardStats);

export default router;
