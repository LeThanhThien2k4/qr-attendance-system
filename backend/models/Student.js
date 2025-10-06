import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  mssv: {
    type: String,
    required: true,
    unique: true,
  },
  hoten: {
    type: String,
    required: true,
  },
  lop: {
    type: String,
    required: true,
  },
  khoa: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  faceData: {
    type: String, // sau này sẽ lưu feature khuôn mặt (base64 hoặc vector)
  },
  createdAt: {
    type: Date,
    default: Date.now,
    },
  faceEmbedding: { type: [Number], default: [] }, // store vector from ML enrollment
  faceImageUrl: { type: String, default: "" } // optional path/url for original image

});

export default mongoose.model("Student", studentSchema);
