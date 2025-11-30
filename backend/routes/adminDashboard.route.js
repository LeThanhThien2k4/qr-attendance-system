import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import { getAdminDashboardStats } from "../controllers/adminDashboard.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("admin"));

router.get("/", getAdminDashboardStats);

export default router;
