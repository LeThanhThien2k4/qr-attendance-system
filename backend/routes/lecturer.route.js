import express from "express";
import { getLecturerDashboard } from "../controllers/lecturer.controller.js";
import  verifyToken  from "../middlewares/auth.js";
import  requireRole from "../middlewares/role.js";

const router = express.Router();

router.get("/dashboard", verifyToken, requireRole("LECTURER"), getLecturerDashboard);

export default router;
