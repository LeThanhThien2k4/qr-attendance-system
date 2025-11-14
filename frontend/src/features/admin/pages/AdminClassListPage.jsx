import React, { useEffect, useState } from "react";
import { Trash2, Edit3, Users } from "lucide-react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

/* ============================================================
   📌 TÌNH TOÁN HỌC KỲ MẶC ĐỊNH
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
  const [form, setForm] = useState({
    code: "",
    name: "",
    course: "",
    lecturer: "",
    semester: getDefaultSemester(),
  });

  const semesters = generateSemesters();

  /* ============================================================
     📌 MODAL QUẢN LÝ SINH VIÊN
  ============================================================ */
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]); // sinh viên trong lớp

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
    });

  /* ============================================================
     📌 SUBMIT FORM
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
      const msg = err.response?.data?.message || "Lỗi xử lý lớp học";
      toast.error(msg);
    }
  };

  /* ============================================================
     📌 EDIT CLASS
  ============================================================ */
  const handleEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code || "",
      name: c.name,
      course: c.course?._id,
      lecturer: c.lecturer?._id,
      semester: c.semester,
    });
  };

  /* ============================================================
     📌 DELETE CLASS
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
     📌 LOAD SINH VIÊN TRONG LỚP
  ============================================================ */
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
     📌 RENDER
  ============================================================ */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Quản lý lớp học phần
      </h1>

      {/* -----------------------------------------------------------
          FORM TẠO / SỬA
      ------------------------------------------------------------ */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3"
      >
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

        <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 col-span-full">
          {editingId ? "Cập nhật lớp học" : "Thêm mới lớp học"}
        </button>
      </form>

      {/* -----------------------------------------------------------
          DANH SÁCH LỚP
      ------------------------------------------------------------ */}
      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Mã lớp</th>
              <th className="px-3 py-2 text-left">Tên lớp</th>
              <th className="px-3 py-2 text-left">Môn học</th>
              <th className="px-3 py-2 text-left">Giảng viên</th>
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
                <td colSpan="6" className="text-center py-6 text-gray-500 italic">
                  Chưa có lớp học phần nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -----------------------------------------------------------
          MODAL QUẢN LÝ SINH VIÊN
      ------------------------------------------------------------ */}
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

            {/* Danh sách sinh viên có thể thêm */}
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
