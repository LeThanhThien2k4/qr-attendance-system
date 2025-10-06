import express from "express";
import {
  getClasses,
  createClass,
  addStudentToClass,
  getClassById,
} from "../controllers/classController.js";

const router = express.Router();

router.get("/", getClasses);
router.post("/", createClass);
router.post("/add-student", addStudentToClass);
router.get("/:id", getClassById);

export default router;
