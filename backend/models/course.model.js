// backend/models/course.model.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    credit: { type: Number, default: 3 },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // người phụ trách (giảng viên)
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
