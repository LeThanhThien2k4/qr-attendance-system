import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent"],
    default: "present",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  qrCode: {
    type: String, // chứa mã QR (string unique)
    },
  faceVerified: { type: Boolean, default: false },
  confidence: { type: Number, default: null },
  method: { type: String, enum: ["qr", "qr+face"], default: "qr" },
  ip: { type: String } // optional metadata

});

export default mongoose.model("Attendance", attendanceSchema);
