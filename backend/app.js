import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import notificationRoutes from "./routes/notification.route.js";
import enrollmentRoutes from "./routes/enrollments.route.js";
import adminUserRoutes from "./routes/adminUsers.route.js";
import adminCoursesRoute from "./routes/adminCourses.route.js";
import adminAttendancesRoute from "./routes/adminAttendances.route.js";
import adminClassesRoute from "./routes/adminClasses.route.js";
import adminOfficialClassRoutes from "./routes/adminOfficialClass.route.js";
import lecturerAttendanceRoutes from "./routes/lecturerAttendances.route.js";
import studentAttendanceRoutes from "./routes/studentAttendance.route.js";
import adminDashboardRoutes from "./routes/adminDashboard.route.js";
import adminRoute from "./routes/admin.route.js";
import lecturerDashboardRoutes from "./routes/lecturerDashboard.route.js";
import studentDashboardRoutes from "./routes/studentDashboard.route.js";



dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));
mongoose.connection.on("connected", () => {
  console.log("🔵 Connected to MongoDB:", mongoose.connection.name);
  console.log("🔵 Collections:", mongoose.connection.collections);
});

// Định nghĩa API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/courses", adminCoursesRoute);
app.use("/api/admin/attendances", adminAttendancesRoute);
app.use("/api/admin/classes", adminClassesRoute);
app.use("/api/admin/official-classes", adminOfficialClassRoutes);
app.use("/api/lecturer", lecturerAttendanceRoutes);
app.use("/api/lecturer", lecturerDashboardRoutes);
app.use("/api/student", studentAttendanceRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/student", studentDashboardRoutes);



// Middleware xử lý lỗi
app.use(errorHandler);

export default app;
