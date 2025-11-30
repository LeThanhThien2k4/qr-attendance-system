import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import { createAdmin } from "../controllers/admin.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("admin"));

router.post("/create-admin", createAdmin);

export default router;
