import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import { getStudentDashboardStats } from "../controllers/studentDashboard.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("student"));

router.get("/dashboard", getStudentDashboardStats);

export default router;
