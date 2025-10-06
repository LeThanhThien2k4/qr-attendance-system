import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  msgv: {
    type: String,
    required: true,
    unique: true,
  },
  hoten: {
    type: String,
    required: true,
  },
  chucvu: {
    type: String,
    default: "Giảng viên"
  },
  email: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Teacher", teacherSchema);
