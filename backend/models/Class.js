import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  tenlop: {
    type: String,
    required: true,
  },
  malop: {
    type: String,
    required: true,
    unique: true,
  },
  monhoc: {
    type: String,
    required: true,
  },
  giangvien: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  sinhviens: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Class", classSchema);
