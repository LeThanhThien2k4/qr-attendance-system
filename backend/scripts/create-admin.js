import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const email = "admin@gmail.com";
  const password = "123456";
  const hashed = await bcrypt.hash(password, 10);

  const exists = await User.findOne({ email });
  if (exists) {
    console.log("⚠️ Admin already exists");
  } else {
    await User.create({
      fullName: "System Admin",
      email,
      password: hashed,
      role: "ADMIN",
      mustChangePassword: false,
    });
    console.log(`✅ Admin created: ${email} / ${password}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
