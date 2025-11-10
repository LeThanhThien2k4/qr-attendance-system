import express from "express";
import { predictAbsence } from "../controllers/ai.controller.js";
import  verifyToken  from "../middlewares/auth.js";
import  requireRole  from "../middlewares/role.js";

const router = express.Router();

router.post("/predict", verifyToken, requireRole("LECTURER", "ADMIN"), predictAbsence);

export default router;
