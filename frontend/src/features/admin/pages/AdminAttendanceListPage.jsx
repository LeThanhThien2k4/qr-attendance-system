import React, { useEffect, useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../lib/axios";

export default function AdminAttendanceListPage() {
  const [attendances, setAttendances] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);

  const [filters, setFilters] = useState({
    lecturerId: "",
    courseId: "",
    classId: "",
    from: "",
    to: "",
  });

  /* =============================
          LOAD FILTER DATA
  ============================= */
  const loadFilterData = async () => {
    try {
      // Load lecturers
      const resLecturers = await api.get("/admin/users?role=lecturer");
      setLecturers(resLecturers.data);

      // Load courses
      const resCourses = await api.get("/admin/courses");
      setCourses(resCourses.data);

      // Load classes (mọi lớp học phần)
      const resClasses = await api.get("/admin/classes");
      setClasses(resClasses.data);
    } catch (err) {
      toast.error("Không thể tải dữ liệu lọc");
    }
  };

  /* =============================
          LOAD ATTENDANCES
  ============================= */
  const loadAttendances = async () => {
    try {
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
        )
      ).toString();

      const res = await api.get(`/admin/attendances?${query}`);
      setAttendances(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách điểm danh");
    }
  };

  useEffect(() => {
    loadFilterData();
    loadAttendances();
  }, []);

  /* =============================
        HANDLE RESET ATTENDANCE
  ============================= */
  const handleReset = async (id) => {
    if (!window.confirm("Reset buổi điểm danh này?")) return;

    try {
      await api.put(`/admin/attendances/${id}/reset`);
      toast.success("Đã reset buổi điểm danh");
      loadAttendances();
    } catch {
      toast.error("Không thể reset");
    }
  };

  /* =============================
        HANDLE DELETE ATTENDANCE
  ============================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa buổi điểm danh này?")) return;

    try {
      await api.delete(`/admin/attendances/${id}`);
      toast.success("Đã xóa buổi điểm danh");
      loadAttendances();
    } catch {
      toast.error("Không thể xóa");
    }
  };

  /* =============================
              RENDER
  ============================= */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Quản lý điểm danh (Admin)
      </h1>

      {/* =============================
              FILTER PANEL
      ============================= */}
      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Giảng viên */}
        <select
          value={filters.lecturerId}
          onChange={(e) =>
            setFilters({ ...filters, lecturerId: e.target.value })
          }
          className="border p-2 rounded-lg"
        >
          <option value="">-- Giảng viên --</option>
          {lecturers.map((gv) => (
            <option key={gv._id} value={gv._id}>
              {gv.name}
            </option>
          ))}
        </select>

        {/* Môn học */}
        <select
          value={filters.courseId}
          onChange={(e) =>
            setFilters({
              ...filters,
              courseId: e.target.value,
              classId: "", // reset lớp học phần khi đổi môn
            })
          }
          className="border p-2 rounded-lg"
        >
          <option value="">-- Môn học --</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Lớp học phần — lọc theo môn */}
        <select
          value={filters.classId}
          onChange={(e) =>
            setFilters({ ...filters, classId: e.target.value })
          }
          className="border p-2 rounded-lg"
        >
          <option value="">-- Lớp học phần --</option>

          {classes
            .filter(
              (cl) =>
                !filters.courseId ||
                cl.course?._id === filters.courseId
            )
            .map((cl) => (
              <option key={cl._id} value={cl._id}>
                {cl.name} ({cl.course?.name})
              </option>
            ))}
        </select>

        {/* From date */}
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          className="border p-2 rounded-lg"
        />

        {/* To date */}
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className="border p-2 rounded-lg"
        />

        {/* Button filter */}
        <button
          onClick={loadAttendances}
          className="col-span-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Lọc dữ liệu
        </button>
      </div>

      {/* =============================
                    TABLE
      ============================= */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b text-gray-700">
            <tr>
              <th className="py-2 px-3 text-left">#</th>
              <th className="py-2 px-3 text-left">Lớp học phần</th>
              <th className="py-2 px-3 text-left">Môn học</th>
              <th className="py-2 px-3 text-left">Giảng viên</th>
              <th className="py-2 px-3 text-left">Ngày</th>
              <th className="py-2 px-3 text-left">Có mặt</th>
              <th className="py-2 px-3 text-left">Vắng</th>
              <th className="py-2 px-3 text-left">QR</th>
              <th className="py-2 px-3 text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {attendances.length ? (
              attendances.map((a, i) => (
                <tr key={a._id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{a.classId?.name}</td>
                  <td className="px-3 py-2">{a.classId?.course?.name}</td>
                  <td className="px-3 py-2">{a.classId?.lecturer?.name}</td>
                  <td className="px-3 py-2">
                    {new Date(a.date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-3 py-2">{a.presentCount}</td>
                  <td className="px-3 py-2">{a.absentCount}</td>

                  {/* QR */}
                  <td className="px-3 py-2">
                    {a.qrLink ? (
                      <img
                        src={a.qrLink}
                        className="w-12 h-12 cursor-pointer hover:scale-110 transition"
                        onClick={() => window.open(a.qrLink, "_blank")}
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-3 py-2 text-center flex gap-3 justify-center">

                    {/* RESET */}
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleReset(a._id)}
                    >
                      <RotateCcw size={18} />
                    </button>

                    {/* DELETE */}
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(a._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-6 italic text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
