// backend/routes/adminCourses.route.js
import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
} from "../controllers/adminCourse.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("admin"));

router.post("/", createCourse);
router.get("/", getCourses);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
