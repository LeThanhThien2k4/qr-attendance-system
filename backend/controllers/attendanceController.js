import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import Student from "../models/Student.js";
import axios from "axios";

export const markAttendance = async (req, res) => {
  try {
    const { qrData, studentId, image } = req.body; // image = base64 dataURL (optional)
    if (!qrData || !studentId) return res.status(400).json({ message: "Missing data" });

    const classId = qrData.split("-")[0];
    const lop = await Class.findById(classId);
    if (!lop) return res.status(404).json({ message: "Class not found" });

    if (!lop.sinhviens.includes(studentId))
      return res.status(400).json({ message: "Student not enrolled in class" });

    // check duplicates in same day
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(23,59,59,999);

    const existed = await Attendance.findOne({
      classId,
      studentId,
      date: { $gte: start, $lte: end }
    });
    if (existed) return res.status(400).json({ message: "Already marked today" });

    // If image provided -> verify with ML
    let faceVerified = false;
    let confidence = null;
    let method = "qr";

    if (image) {
      // Call Flask ML service
      const mlUrl = process.env.ML_VERIFY_URL || "http://localhost:5001/verify";
      const payload = { studentId, image }; // image should be dataURL
      const mlRes = await axios.post(mlUrl, payload, { timeout: 10000 });

      if (mlRes.data && mlRes.data.verified) {
        faceVerified = true;
        confidence = mlRes.data.confidence ?? null;
        method = "qr+face";
      } else {
        // If not verified, you can choose to reject or mark as pending
        return res.status(400).json({ message: "Face verification failed", details: mlRes.data });
      }
    }

    const attendance = new Attendance({
      classId,
      studentId,
      status: "present",
      date: new Date(),
      qrCode: qrData,
      faceVerified,
      confidence,
      method,
      ip: req.ip
    });

    await attendance.save();

    return res.status(201).json({ message: "Attendance marked", attendance });
  } catch (err) {
    console.error("markAttendance error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
