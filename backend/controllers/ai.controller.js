import AILog from "../models/aiLog.model.js";
import axios from "axios";

// Gọi AI dự đoán xu hướng nghỉ học
export const predictAbsence = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const response = await axios.post(process.env.AI_URL + "/predict", { studentId, courseId });
    const probability = response.data.probability;

    await AILog.create({
      studentId,
      courseId,
      predictedProbability: probability,
    });

    res.json({ studentId, courseId, probability });
  } catch (err) {
    res.status(500).json({ message: "AI prediction failed", error: err.message });
  }
};
