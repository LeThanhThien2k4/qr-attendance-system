// backend/models/officialClass.model.js
import mongoose from "mongoose";

const officialClassSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // VD: 22DTH2A
    major: { type: String, required: true },              // Công nghệ thông tin
    courseYear: { type: Number, required: true },         // 2022
    advisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",                                        // giảng viên cố vấn
      default: null,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",                                      // sinh viên
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("OfficialClass", officialClassSchema);
