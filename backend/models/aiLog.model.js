import mongoose from "mongoose";

const aiLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  modelVersion: { type: String, default: "v1" },
  predictedProbability: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AILog", aiLogSchema);
