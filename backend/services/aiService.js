import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * Gọi service AI để dự đoán xác suất vắng học
 * @param {Object} params { studentId, courseId }
 * @returns {Promise<Number>} probability (0–1)
 */
export const predictAbsenceAI = async (params) => {
  try {
    const res = await axios.post(`${process.env.AI_URL}/predict`, params);
    if (res.data?.probability !== undefined) {
      return res.data.probability;
    }
    throw new Error("AI response invalid");
  } catch (err) {
    console.error("AI service error:", err.message);
    throw new Error("AI service unreachable or failed");
  }
};

/**
 * Ví dụ Flask API trả JSON:
 * {
 *   "studentId": "123",
 *   "courseId": "ABC123",
 *   "probability": 0.72
 * }
 */
