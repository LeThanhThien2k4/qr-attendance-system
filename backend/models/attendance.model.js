// backend/models/attendance.model.js
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: { type: Date, default: Date.now },

    expireAt: { type: Date, required: true }, // QR hết hạn
    qrLink: { type: String },


    studentsPresent: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        checkInTime: Date,
        gps: {
          lat: Number,
          lng: Number,
        },
        device: {
          userAgent: String,
          platform: String,
        },
      },
    ],

    studentsAbsent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },

    // thời khóa biểu (nếu bạn muốn gắn theo buổi)
    slot: {
      week: Number,
      lesson: Number, // vd: tiết 1–3
      room: String,
    },
  },
  { timestamps: true }
);

// Xóa lịch sử sau 1 năm nếu cần
attendanceSchema.index({ expireAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model("Attendance", attendanceSchema);
