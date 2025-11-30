import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: function () {
    return this.role !== "admin";   // student & lecturer bắt buộc, admin thì không
  },
      unique: true, // Mã sinh viên / mã giảng viên
      trim: true,
      sparse: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true, // luôn hash bằng bcrypt
    },

    role: {
      type: String,
      enum: ["admin", "lecturer", "student"],
      required: true,
      default: "student",
    },

    // ===== STUDENT ONLY =====
    officialClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OfficialClass",
      default: null,
    },

    // ===== OPTIONAL FIELDS =====
    phone: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    dob: {
      type: Date,
      default: null,
    },

    // ===== LECTURER OPTIONAL INFO =====
    department: {
      type: String,
      default: "",
    },

    degree: {
      type: String, // ThS, TS, PGS, GS,...
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
