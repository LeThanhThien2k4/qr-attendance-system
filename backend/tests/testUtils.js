import mongoose from "mongoose";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Class from "../models/class.model.js";
import Attendance from "../models/attendance.model.js";

/* =========================================================
   COMMON GENERATORS
========================================================= */

const rand = () => Math.random().toString(36).slice(2, 10);

const genEmail = () => `test_${rand()}@mail.com`;
const genCode = (prefix) => `${prefix}_${rand()}`;

const futureDate = (minutes = 60) =>
  new Date(Date.now() + minutes * 60 * 1000);

/* =========================================================
   USER FACTORIES
========================================================= */

export const createStudent = async (overrides = {}) => {
  return User.create({
    name: overrides.name || "Test Student",
    role: "student",
    code: overrides.code || genCode("SV"),
    email: overrides.email || genEmail(),
    password: overrides.password || "123456",
    isDeleted: overrides.isDeleted ?? false,
  });
};

export const createLecturer = async (overrides = {}) => {
  return User.create({
    name: overrides.name || "Test Lecturer",
    role: "lecturer",
    code: overrides.code || genCode("GV"),
    email: overrides.email || genEmail(),
    password: overrides.password || "123456",
  });
};

export const createAdmin = async (overrides = {}) => {
  return User.create({
    name: overrides.name || "Test Admin",
    role: "admin",
    code: overrides.code || genCode("AD"),
    email: overrides.email || genEmail(),
    password: overrides.password || "123456",
  });
};

/* =========================================================
   COURSE FACTORY
========================================================= */

export const createCourse = async (overrides = {}) => {
  return Course.create({
    code: overrides.code || genCode("COURSE"),
    name: overrides.name || "Test Course",
    credit: overrides.credit || 3,
    lecturer: overrides.lecturer || null,
    isActive: overrides.isActive ?? true,
  });
};

/* =========================================================
   CLASS FACTORY (CHUẨN SCHEMA)
========================================================= */

export const createClass = async ({
  students = [],
  semester = "HK1-2024-2025",
  overrides = {},
} = {}) => {
  const lecturer =
    overrides.lecturer || (await createLecturer());

  const course =
    overrides.course ||
    (await createCourse({ lecturer: lecturer._id }));

  return Class.create({
    code: overrides.code || genCode("CLASS"),
    name: overrides.name || "Lớp học phần test",
    course: course._id,
    lecturer: lecturer._id,
    students,
    semester,
    isActive: true,

    // optional fields
    schedule: overrides.schedule || [],
    location: overrides.location || {
      lat: 10.8231,
      lng: 106.6297,
      radius: 200,
    },
  });
};

/* =========================================================
   ATTENDANCE FACTORY (QUAN TRỌNG NHẤT)
========================================================= */

export const createAttendance = async ({
  classDoc,
  studentsPresent = [],
  studentsAbsent = [],
  overrides = {},
} = {}) => {
  if (!classDoc) {
    throw new Error("createAttendance requires classDoc");
  }

  return Attendance.create({
    classId: classDoc._id,
    lecturerId: classDoc.lecturer,
    date: overrides.date || new Date(),
    expireAt: overrides.expireAt || futureDate(), // 👈 BẮT BUỘC
    qrLink: overrides.qrLink || null,

    studentsPresent,
    studentsAbsent,

    presentCount:
      overrides.presentCount ??
      studentsPresent.length,

    absentCount:
      overrides.absentCount ??
      studentsAbsent.length,

    slot: overrides.slot || {
      week: 1,
      lesson: 1,
      room: "A101",
    },
  });
};

/* =========================================================
   DB CLEANER (SAFEST)
========================================================= */

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
