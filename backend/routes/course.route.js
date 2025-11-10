import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
} from "../controllers/course.controller.js";
import  verifyToken  from "../middlewares/auth.js";
import  requireRole  from "../middlewares/role.js";

const router = express.Router();

router.post("/", verifyToken, requireRole("ADMIN"), createCourse);
router.get("/", verifyToken, getCourses);
router.get("/:id", verifyToken, getCourseById);

export default router;
