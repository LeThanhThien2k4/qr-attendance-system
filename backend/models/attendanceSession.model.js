import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  date: { type: Date, required: true },
  qrCode: { type: String, required: true }, // token ký HMAC
  gpsLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    radius: { type: Number, default: 50 }, // mét
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  expiresAt: { type: Date }, // hạn dùng mã QR
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AttendanceSession", attendanceSessionSchema);
