// backend/models/class.model.js
import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    schedule: [
      {
        dayOfWeek: String,
        startTime: String,
        endTime: String,
        lesson: String,  // 1–3, 4–6, optional
        room: String,
        weeks: [Number], // [1,2,3,...]
      },
    ],

    /* -----------------------------------
       🟩 GPS PHÒNG HỌC — mới thêm
    ----------------------------------- */
    location: {
      lat: { type: Number},
      lng: { type: Number},
      radius: { type: Number, default: 200 }, // 200m
    },

    semester: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

classSchema.index({ name: 1, course: 1, semester: 1 }, { unique: true });
classSchema.index({ code: 1 }, { unique: true });

export default mongoose.model("Class", classSchema);
