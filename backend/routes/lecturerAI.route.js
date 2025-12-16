import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import { lecturerAnalyzeAttendanceAI } from "../controllers/lecturerAI.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("lecturer"));

// GET /api/ai/predict/class?classId=...
router.get("/predict/class", lecturerAnalyzeAttendanceAI);

export default router;
