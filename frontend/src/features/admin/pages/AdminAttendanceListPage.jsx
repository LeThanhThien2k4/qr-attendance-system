import React, { useEffect, useRef, useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../lib/axios";

/* =======================
   Utils
======================= */
const getCourseId = (cl) =>
  typeof cl.course === "string" ? cl.course : cl.course?._id;

const getCourseName = (cl) =>
  typeof cl.course === "string" ? "" : cl.course?.name || "";

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

  const [loading, setLoading] = useState(false);

  // ✅ chặn StrictMode gọi 2 lần trong dev
  const didInit = useRef(false);

  // ✅ abort request cũ khi bấm lọc liên tục
  const abortRef = useRef(null);

  const loadFilterData = async () => {
    try {
      const [resLecturers, resCourses, resClasses] = await Promise.all([
        api.get("/admin/users?role=lecturer"),
        api.get("/admin/courses"),
        api.get("/admin/classes"),
      ]);

      setLecturers(resLecturers.data || []);
      setCourses(resCourses.data || []);
      setClasses(resClasses.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải dữ liệu lọc");
    }
  };

  const buildQuery = () => {
    const cleaned = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

    // optional: nếu đã chọn classId thì bỏ courseId cho gọn query
    if (cleaned.classId) delete cleaned.courseId;

    return new URLSearchParams(cleaned).toString();
  };

  const loadAttendances = async () => {
    // abort request cũ
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const query = buildQuery();

    try {
      setLoading(true);

      const res = await api.get(`/admin/attendances?${query}`, {
        signal: abortRef.current.signal,
      });

      setAttendances(res.data || []);
    } catch (err) {
      // abort thì bỏ qua
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;

      console.error(err);
      toast.error("Không thể tải danh sách điểm danh", { id: "att-load-err" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    loadFilterData();
    loadAttendances();
  }, []);

  const handleReset = async (id) => {
    if (!window.confirm("Reset buổi điểm danh này?")) return;
    try {
      await api.put(`/admin/attendances/${id}/reset`);
      toast.success("Đã reset buổi điểm danh");
      loadAttendances();
    } catch (err) {
      console.error(err);
      toast.error("Không thể reset");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa buổi điểm danh này?")) return;
    try {
      await api.delete(`/admin/attendances/${id}`);
      toast.success("Đã xóa buổi điểm danh");
      loadAttendances();
    } catch (err) {
      console.error(err);
      toast.error("Không thể xóa");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Quản lý điểm danh (Admin)
      </h1>

      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <select
          value={filters.lecturerId}
          onChange={(e) => setFilters({ ...filters, lecturerId: e.target.value })}
          className="border p-2 rounded-lg"
        >
          <option value="">-- Giảng viên --</option>
          {lecturers.map((gv) => (
            <option key={gv._id} value={gv._id}>
              {gv.name}
            </option>
          ))}
        </select>

        <select
          value={filters.courseId}
          onChange={(e) =>
            setFilters({
              ...filters,
              courseId: e.target.value,
              classId: "",
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

        <select
          value={filters.classId}
          onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
          className="border p-2 rounded-lg"
        >
          <option value="">-- Lớp học phần --</option>
          {classes
            .filter((cl) => !filters.courseId || getCourseId(cl) === filters.courseId)
            .map((cl) => (
              <option key={cl._id} value={cl._id}>
                {cl.name} {getCourseName(cl) && `(${getCourseName(cl)})`}
              </option>
            ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          className="border p-2 rounded-lg"
        />

        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className="border p-2 rounded-lg"
        />

        <button
          onClick={loadAttendances}
          disabled={loading}
          className="col-span-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Đang lọc..." : "Lọc dữ liệu"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b text-gray-700">
            <tr>
              <th className="py-2 px-3 text-left">#</th>
              <th className="py-2 px-3 text-left">Lớp</th>
              <th className="py-2 px-3 text-left">Môn</th>
              <th className="py-2 px-3 text-left">Giảng viên</th>
              <th className="py-2 px-3 text-left">Ngày</th>
              <th className="py-2 px-3 text-left">Tuần</th>
              <th className="py-2 px-3 text-left">Tiết</th>
              <th className="py-2 px-3 text-left">Phòng</th>
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
                  <td className="px-3 py-2">{a.classId?.name || "-"}</td>
                  <td className="px-3 py-2">{a.classId?.course?.name || "-"}</td>
                  <td className="px-3 py-2">{a.classId?.lecturer?.name || "-"}</td>
                  <td className="px-3 py-2">
                    {a.date ? new Date(a.date).toLocaleDateString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2 text-blue-700 font-semibold">
                    Tuần {a.week}
                  </td>
                  <td className="px-3 py-2">Tiết {a.lesson}</td>
                  <td className="px-3 py-2">{a.room}</td>
                  <td className="px-3 py-2">{a.presentCount}</td>
                  <td className="px-3 py-2">{a.absentCount}</td>

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

                  <td className="px-3 py-2 text-center flex gap-3 justify-center">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleReset(a._id)}
                    >
                      <RotateCcw size={18} />
                    </button>

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
                <td colSpan="12" className="text-center py-6 italic text-gray-500">
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
