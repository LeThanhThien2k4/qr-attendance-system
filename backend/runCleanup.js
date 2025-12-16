// runCleanup.js
import mongoose from "mongoose";
import dotenv from "dotenv";

import { cleanup } from "./cleanup.js";

// 1️⃣ LOAD ENV
dotenv.config();

// 2️⃣ CHECK ENV (debug-friendly)
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is undefined. Check .env file");
  process.exit(1);
}

// 3️⃣ CONNECT DB
(async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    // 4️⃣ RUN CLEANUP
    await cleanup();

    console.log("🎉 Cleanup finished. Exit.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
})();
