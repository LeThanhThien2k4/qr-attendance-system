import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  schedule: {
    dayOfWeek: { type: String }, // Thứ trong tuần (e.g. "Monday")
    startTime: { type: String }, // e.g. "08:00"
    endTime: { type: String },   // e.g. "09:30"
    room: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Class", classSchema);
