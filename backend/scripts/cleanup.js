// backend/scripts/cleanup.js
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";
import User from "../models/user.model.js";

export const cleanup = async () => {
  try {
    console.log("\n🧹 BẮT ĐẦU DỌN DỮ LIỆU ATTENDANCE (FINAL)...\n");

    /* =========================================================
       1. CLASS HỢP LỆ + ROSTER
    ========================================================= */
    const classes = await Class.find().select("_id students").lean();

    const validClassIds = new Set(classes.map(c => c._id.toString()));
    const classStudentMap = new Map(
      classes.map(c => [
        c._id.toString(),
        (c.students || []).map(id => id.toString())
      ])
    );

    /* =========================================================
       2. STUDENT CÒN HIỆU LỰC (THEO SCHEMA: isActive)
    ========================================================= */
    const students = await User.find({
      role: "student",
      isActive: true,
    })
      .select("_id")
      .lean();

    const activeStudentSet = new Set(
      students.map(s => s._id.toString())
    );

    console.log(`📚 Class hợp lệ: ${validClassIds.size}`);
    console.log(`👨‍🎓 Student còn hiệu lực: ${activeStudentSet.size}`);

    /* =========================================================
       3. XOÁ ATTENDANCE RÁC
    ========================================================= */
    await Attendance.deleteMany({
      $or: [{ classId: null }, { classId: { $exists: false } }],
    });

    await Attendance.deleteMany({
      classId: { $nin: Array.from(validClassIds) },
    });

    /* =========================================================
       4. REBUILD SNAPSHOT
    ========================================================= */
    const attendances = await Attendance.find();
    let rebuilt = 0;

for (const att of attendances) {
  const classId = att.classId?.toString();
  if (!classId || !classStudentMap.has(classId)) continue;

  const roster = classStudentMap
    .get(classId)
    .filter(id => activeStudentSet.has(id));

  // === CLEAN PRESENT ===
  att.studentsPresent = (att.studentsPresent || []).filter(p => {
    const sid = p.studentId?.toString();
    return sid && roster.includes(sid);
  });

  const presentIds = new Set(
    att.studentsPresent.map(p => p.studentId.toString())
  );

  // === REBUILD ABSENT ===
  att.studentsAbsent = roster.filter(
    sid => !presentIds.has(sid)
  );

  // === REBUILD COUNTS ===
  att.presentCount = att.studentsPresent.length;
  att.absentCount = att.studentsAbsent.length;

  // ✅ LUÔN SAVE — vì snapshot đã được rebuild theo realtime
  await att.save();
  rebuilt++;
  console.log(`✔ Rebuilt snapshot attendance ${att._id}`);
}


    console.log(`\n✅ Đã rebuild snapshot trong ${rebuilt} attendance`);
    console.log("🎉 CLEANUP ATTENDANCE HOÀN TẤT!\n");
  } catch (err) {
    console.error("❌ CLEANUP ERROR:", err);
    throw err;
  }
};
