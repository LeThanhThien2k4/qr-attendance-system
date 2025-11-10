import Course from "../models/course.model.js";

export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCourses = async (req, res) => {
  const data = await Course.find().populate("lecturerId", "fullName email");
  res.json(data);
};

export const getCourseById = async (req, res) => {
  const c = await Course.findById(req.params.id).populate("lecturerId");
  if (!c) return res.status(404).json({ message: "Course not found" });
  res.json(c);
};
