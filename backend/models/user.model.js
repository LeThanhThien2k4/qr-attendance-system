import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // thay vì passwordHash
  role: { type: String, enum: ["admin", "lecturer", "student"], default: "student" },
  phone: { String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
