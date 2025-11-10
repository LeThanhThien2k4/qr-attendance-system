import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otpCode: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
});

otpSchema.index({ email: 1, otpCode: 1 });

export default mongoose.model("OTP", otpSchema);
