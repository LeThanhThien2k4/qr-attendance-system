import express from "express";
import verifyToken from "../middlewares/auth.js";
import requireRole from "../middlewares/role.js";
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  getStudentsInClass,
} from "../controllers/adminClass.controller.js";

const router = express.Router();
router.use(verifyToken, requireRole("admin"));

router.post("/", createClass);
router.get("/", getClasses);
router.get("/:id", getClassById);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);
router.post("/:classId/add-student", addStudentToClass);
router.delete("/:classId/remove-student/:studentId", removeStudentFromClass);
router.get("/:classId/students", getStudentsInClass);

export default router;
