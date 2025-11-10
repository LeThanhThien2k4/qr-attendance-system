import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendanceSession",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["PRESENT", "ABSENT", "LATE"],
    default: "PRESENT",
  },
  checkInTime: { type: Date, default: Date.now },
  gpsData: {
    lat: Number,
    lng: Number,
    accuracy: Number,
  },
  aiPrediction: { type: Number, default: 0 }, // Xác suất vắng học
  reason: String,
});

attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("AttendanceRecord", attendanceRecordSchema);
