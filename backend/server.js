import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import morgan from "morgan";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import qrcodeRoutes from "./routes/qrcodeRoutes.js";



dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // in request logs to console


connectDB();

app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/qrcode", qrcodeRoutes);

app.use(notFound);
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("✅ QR Attendance System API is running...");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
