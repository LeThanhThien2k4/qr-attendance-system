import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/user.model.js";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";

import { cleanup } from "../scripts/cleanup.js";

import {
  createStudent,
  createClass,
  createAttendance,
  clearDatabase,
} from "./testUtils.js";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await clearDatabase();
});

describe("cleanupAttendance()", () => {
  test("❌ Xóa attendance orphan (class đã bị xóa) + giữ attendance hợp lệ", async () => {
    // Class 1 hợp lệ (sẽ giữ)
    const s1 = await createStudent();
    const cls1 = await createClass({ students: [s1._id] });

    await createAttendance({
      classDoc: cls1,
      studentsPresent: [],
      studentsAbsent: [s1._id],
    });

    // Class 2 tạo attendance rồi xóa class -> attendance thành orphan (phải bị xóa)
    const s2 = await createStudent();
    const cls2 = await createClass({ students: [s2._id] });

    const orphanAtt = await createAttendance({
      classDoc: cls2,
      studentsPresent: [],
      studentsAbsent: [s2._id],
    });

    // Xóa class -> orphan
    await Class.findByIdAndDelete(cls2._id);

    await cleanup();

    const all = await Attendance.find().lean();

    // Chỉ còn attendance của cls1
    expect(all.length).toBe(1);
    expect(all[0].classId.toString()).toBe(cls1._id.toString());

    // orphan attendance đã bị xóa
    const stillOrphan = await Attendance.findById(orphanAtt._id);
    expect(stillOrphan).toBeNull();
  });

  test("✔ Remove soft-deleted student khỏi snapshot (present/absent/count)", async () => {
    const activeStudent = await createStudent();
    const deletedStudent = await createStudent();
      
    await User.findByIdAndUpdate(deletedStudent._id, { isActive: false });
    const cls = await createClass({
      students: [activeStudent._id, deletedStudent._id],
    });

    const att = await createAttendance({
      classDoc: cls,
      studentsPresent: [{ studentId: deletedStudent._id }],
      studentsAbsent: [activeStudent._id, deletedStudent._id],
      overrides: { presentCount: 1, absentCount: 2 }, // snapshot cũ
    });

    await cleanup();

    const updated = await Attendance.findById(att._id).lean();

    expect(updated.studentsPresent.length).toBe(0);
    expect(updated.studentsAbsent.length).toBe(1);
    expect(updated.studentsAbsent[0].toString()).toBe(activeStudent._id.toString());
    expect(updated.presentCount).toBe(0);
    expect(updated.absentCount).toBe(1);
  });

  test("✔ Rebuild studentsAbsent = roster(active) − present", async () => {
    const s1 = await createStudent();
    const s2 = await createStudent();
    const s3 = await createStudent();

    const cls = await createClass({ students: [s1._id, s2._id, s3._id] });

    // Snapshot sai cố ý: absent chứa nhầm s1, thiếu s3
    const att = await createAttendance({
      classDoc: cls,
      studentsPresent: [{ studentId: s1._id }],
      studentsAbsent: [s1._id, s2._id],
      overrides: { presentCount: 1, absentCount: 2 },
    });

    await cleanup();

    const updated = await Attendance.findById(att._id).lean();

    expect(updated.presentCount).toBe(1);
    expect(updated.absentCount).toBe(2);

    const absentIds = updated.studentsAbsent.map((id) => id.toString());
    expect(absentIds).toContain(s2._id.toString());
    expect(absentIds).toContain(s3._id.toString());
    expect(absentIds).not.toContain(s1._id.toString());
  });

  test("✔ Attendance đã đúng snapshot thì giữ nguyên", async () => {
    const s1 = await createStudent();
    const s2 = await createStudent();

    const cls = await createClass({ students: [s1._id, s2._id] });

    const att = await createAttendance({
      classDoc: cls,
      studentsPresent: [{ studentId: s1._id }],
      studentsAbsent: [s2._id],
      overrides: { presentCount: 1, absentCount: 1 },
    });

    await cleanup();

    const updated = await Attendance.findById(att._id).lean();

    expect(updated.presentCount).toBe(1);
    expect(updated.absentCount).toBe(1);
    expect(updated.studentsPresent.length).toBe(1);
    expect(updated.studentsPresent[0].studentId.toString()).toBe(s1._id.toString());
    expect(updated.studentsAbsent.length).toBe(1);
    expect(updated.studentsAbsent[0].toString()).toBe(s2._id.toString());
  });
});
