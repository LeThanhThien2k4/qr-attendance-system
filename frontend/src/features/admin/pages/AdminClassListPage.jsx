import React, { useEffect, useState } from "react";
import { Trash2, Edit3, Users, CalendarPlus, X } from "lucide-react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

/* ============================================================
   📌 TÍNH TOÁN HỌC KỲ MẶC ĐỊNH
============================================================ */
function getDefaultSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const nextYear = year + 1;
  return `${year}-${nextYear}_K1`;
}

function generateSemesters() {
  const now = new Date();
  const year = now.getFullYear();
  const nextYear = year + 1;
  const prefix = `${year}-${nextYear}`;
  return [
    { value: `${prefix}_K1`, label: `Học kỳ 1 ${prefix} (T9–T12)` },
    { value: `${prefix}_K2`, label: `Học kỳ 2 ${prefix} (T1–T4)` },
    { value: `${prefix}_K3`, label: `Học kỳ 3 ${prefix} (T5–T8)` },
  ];
}

export default function AdminClassListPage() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);

  const [editingId, setEditingId] = useState(null);

  /* ============================================================
     📌 FORM CHÍNH (CÓ THÊM SCHEDULE)
  ============================================================ */
  const [form, setForm] = useState({
    code: "",
    name: "",
    course: "",
    lecturer: "",
    semester: getDefaultSemester(),
    schedule: [], // ⭐ NEW
  });

  // Form nhập lịch học tạm thời
  const [scheduleTemp, setScheduleTemp] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    lesson: "",
    room: "",
    weeks: "",
  });

  const semesters = generateSemesters();

  /* ============================================================
     📌 LOAD DATA
  ============================================================ */
  const loadClasses = async () => {
    try {
      const res = await api.get("/admin/classes");
      setClasses(res.data);
    } catch {
      toast.error("Không thể tải danh sách lớp học");
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.get("/admin/courses");
      setCourses(res.data);
    } catch {
      toast.error("Không thể tải môn học");
    }
  };

  const loadLecturers = async () => {
    try {
      const res = await api.get("/admin/users");
      const raw = res.data.users || res.data;

      setLecturers(raw.filter((u) => u.role === "lecturer"));
      setStudents(raw.filter((u) => u.role === "student"));
    } catch {
      toast.error("Không thể tải danh sách giảng viên / sinh viên");
    }
  };

  useEffect(() => {
    loadCourses();
    loadLecturers();
    loadClasses();
  }, []);

  /* ============================================================
     📌 RESET FORM
  ============================================================ */
  const resetForm = () =>
    setForm({
      code: "",
      name: "",
      course: "",
      lecturer: "",
      semester: getDefaultSemester(),
      schedule: [],
    });

  /* ============================================================
     📌 XỬ LÝ THÊM LỊCH HỌC
  ============================================================ */
  const addScheduleToForm = () => {
    if (
      !scheduleTemp.dayOfWeek ||
      !scheduleTemp.startTime ||
      !scheduleTemp.endTime ||
      !scheduleTemp.lesson ||
      !scheduleTemp.room
    ) {
      return toast.error("Vui lòng nhập đầy đủ thông tin lịch học");
    }

    const weeksParsed =
      scheduleTemp.weeks
        ?.split(",")
        .map((w) => Number(w.trim()))
        .filter((w) => !isNaN(w)) || [];

    const newSchedule = {
      dayOfWeek: scheduleTemp.dayOfWeek,
      startTime: scheduleTemp.startTime,
      endTime: scheduleTemp.endTime,
      lesson: scheduleTemp.lesson,
      room: scheduleTemp.room,
      weeks: weeksParsed,
    };

    setForm({ ...form, schedule: [...form.schedule, newSchedule] });

    // Clear input
    setScheduleTemp({
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      lesson: "",
      room: "",
      weeks: "",
    });
  };

  const removeSchedule = (index) => {
    setForm({
      ...form,
      schedule: form.schedule.filter((_, i) => i !== index),
    });
  };

  /* ============================================================
     📌 SUBMIT
  ============================================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.course || !form.lecturer)
      return toast.error("Vui lòng nhập đủ thông tin");

    try {
      if (editingId) {
        await api.put(`/admin/classes/${editingId}`, form);
        toast.success("Cập nhật lớp học thành công");
      } else {
        await api.post("/admin/classes", form);
        toast.success("Tạo lớp học thành công");
      }

      resetForm();
      setEditingId(null);
      loadClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi xử lý lớp học");
    }
  };

  /* ============================================================
     📌 EDIT
  ============================================================ */
  const handleEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code || "",
      name: c.name,
      course: c.course?._id,
      lecturer: c.lecturer?._id,
      semester: c.semester,
      schedule: c.schedule || [],
    });
  };

  /* ============================================================
     📌 DELETE
  ============================================================ */
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xoá lớp này?")) return;
    try {
      await api.delete(`/admin/classes/${id}`);
      toast.success("Đã xoá lớp");
      loadClasses();
    } catch {
      toast.error("Không thể xoá lớp học");
    }
  };

  /* ============================================================
     📌 QUẢN LÝ SINH VIÊN
  ============================================================ */
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);

  const openStudentModal = async (cls) => {
    setCurrentClass(cls);

    try {
      const res = await api.get(`/admin/classes/${cls._id}/students`);
      setClassStudents(res.data);
      setShowStudentModal(true);
    } catch {
      toast.error("Không thể tải danh sách sinh viên");
    }
  };

  const addStudent = async (studentId) => {
    try {
      await api.post(`/admin/classes/${currentClass._id}/add-student`, {
        studentId,
      });
      toast.success("Đã thêm sinh viên");
      openStudentModal(currentClass);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thêm sinh viên");
    }
  };

  const removeStudent = async (studentId) => {
    try {
      await api.delete(
        `/admin/classes/${currentClass._id}/remove-student/${studentId}`
      );
      toast.success("Đã xoá sinh viên");
      openStudentModal(currentClass);
    } catch {
      toast.error("Không thể xoá sinh viên");
    }
  };

  /* ============================================================
     📌 UI RENDER
  ============================================================ */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Quản lý lớp học phần
      </h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow border space-y-4"
      >
        {/* FORM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            placeholder="Mã lớp (tùy chọn)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="border rounded px-3 py-2"
          />

          <input
            required
            placeholder="Tên lớp (VD: Nhóm 1)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-3 py-2"
          />

          <select
            required
            value={form.course}
            onChange={(e) => setForm({ ...form, course: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Chọn môn học</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            required
            value={form.lecturer}
            onChange={(e) => setForm({ ...form, lecturer: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Chọn giảng viên</option>
            {lecturers.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </select>

          <select
            required
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Chọn học kỳ</option>
            {semesters.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* ============================================================
           📌 SCHEDULE BUILDER
        ============================================================ */}
        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarPlus size={20} /> Lịch học của lớp
          </h2>

          {/* INPUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <select
              value={scheduleTemp.dayOfWeek}
              onChange={(e) =>
                setScheduleTemp({ ...scheduleTemp, dayOfWeek: e.target.value })
              }
              className="border rounded px-3 py-2"
            >
              <option value="">Thứ</option>
              <option value="Monday">Thứ 2</option>
              <option value="Tuesday">Thứ 3</option>
              <option value="Wednesday">Thứ 4</option>
              <option value="Thursday">Thứ 5</option>
              <option value="Friday">Thứ 6</option>
              <option value="Saturday">Thứ 7</option>
              <option value="Sunday">Chủ nhật</option>
            </select>

            <input
              type="time"
              value={scheduleTemp.startTime}
              onChange={(e) =>
                setScheduleTemp({ ...scheduleTemp, startTime: e.target.value })
              }
              className="border rounded px-3 py-2"
            />

            <input
              type="time"
              value={scheduleTemp.endTime}
              onChange={(e) =>
                setScheduleTemp({ ...scheduleTemp, endTime: e.target.value })
              }
              className="border rounded px-3 py-2"
            />

            <input
              placeholder="Tiết (VD: 1-3)"
              value={scheduleTemp.lesson}
              onChange={(e) =>
                setScheduleTemp({ ...scheduleTemp, lesson: e.target.value })
              }
              className="border rounded px-3 py-2"
            />

            <input
              placeholder="Phòng học"
              value={scheduleTemp.room}
              onChange={(e) =>
                setScheduleTemp({ ...scheduleTemp, room: e.target.value })
              }
              className="border rounded px-3 py-2"
            />

            <input
              placeholder="Tuần học (VD: 1,2,3)"
              value={scheduleTemp.weeks}
              onChange={(e) =>
                setScheduleTemp({ ...scheduleTemp, weeks: e.target.value })
              }
              className="border rounded px-3 py-2"
            />
          </div>

          <button
            type="button"
            onClick={addScheduleToForm}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Thêm buổi học
          </button>

          {/* DANH SÁCH SCHEDULE */}
          <div className="space-y-2">
            {form.schedule.map((sch, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border rounded p-3 bg-white"
              >
                <div>
                  <p className="font-semibold text-gray-700">
                    {sch.dayOfWeek} – {sch.startTime} → {sch.endTime}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tiết: {sch.lesson} • Phòng: {sch.room} • Tuần:{" "}
                    {sch.weeks.join(", ") || "—"}
                  </p>
                </div>

                <button
                  onClick={() => removeSchedule(idx)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT */}
        <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 w-full">
          {editingId ? "Cập nhật lớp học" : "Thêm mới lớp học"}
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Mã lớp</th>
              <th className="px-3 py-2 text-left">Tên lớp</th>
              <th className="px-3 py-2 text-left">Môn học</th>
              <th className="px-3 py-2 text-left">Giảng viên</th>
              <th className="px-3 py-2 text-center">Số SV</th>
              <th className="px-3 py-2 text-left">Học kỳ</th>
              <th className="px-3 py-2 text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {classes.length ? (
              classes.map((c) => (
                <tr key={c._id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{c.code || "-"}</td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">{c.course?.name}</td>
                  <td className="px-3 py-2">{c.lecturer?.name}</td>

                  <td className="px-3 py-2 text-center font-semibold text-blue-700">
                    {c.students?.length || 0}
                  </td>

                  <td className="px-3 py-2">{c.semester}</td>

                  <td className="px-3 py-2 text-center flex justify-center gap-4">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleEdit(c)}
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={() => openStudentModal(c)}
                    >
                      <Users size={18} />
                    </button>

                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(c._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-6 text-gray-500 italic"
                >
                  Chưa có lớp học phần nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =======================================
          MODAL QUẢN LÝ SINH VIÊN 
      ======================================== */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[750px] rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">
              Quản lý sinh viên – {currentClass?.name}
            </h2>

            {/* Danh sách trong lớp */}
            <h3 className="font-medium mb-1">Sinh viên hiện tại</h3>
            <div className="border rounded p-2 max-h-40 overflow-y-auto mb-4">
              {classStudents.length ? (
                classStudents.map((s) => (
                  <div
                    key={s._id}
                    className="flex justify-between items-center border-b py-1"
                  >
                    <span>
                      {s.name} – {s.email}
                    </span>
                    <button
                      onClick={() => removeStudent(s._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Xoá
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">Chưa có sinh viên nào</p>
              )}
            </div>

            {/* Danh sách thêm */}
            <h3 className="font-medium mb-1">Thêm sinh viên</h3>
            <div className="border rounded p-2 max-h-40 overflow-y-auto">
              {students
                .filter((s) => !classStudents.some((cs) => cs._id === s._id))
                .map((s) => (
                  <div
                    key={s._id}
                    className="flex justify-between items-center border-b py-1"
                  >
                    <span>
                      {s.name} – {s.email}
                    </span>
                    <button
                      onClick={() => addStudent(s._id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Thêm
                    </button>
                  </div>
                ))}
            </div>

            <button
              className="mt-4 bg-gray-700 text-white px-4 py-2 rounded"
              onClick={() => setShowStudentModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
