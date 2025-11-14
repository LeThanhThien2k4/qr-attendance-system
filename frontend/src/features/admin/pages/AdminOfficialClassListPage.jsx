import React, { useEffect, useState } from "react";
import { Edit3, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../lib/axios";
import ExcelImportButton from "../../../components/ExcelImportButton";
import ExcelExportButton from "../../../components/ExcelExportButton";

export default function AdminOfficialClassListPage() {
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState({
    code: "",
    major: "",
    courseYear: "",
    advisor: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");

  /* ==========================================
        LOAD DATA
  ========================================== */
  const loadClasses = async () => {
    try {
      const res = await api.get("/admin/official-classes");
      setClasses(res.data);
    } catch {
      toast.error("Không thể tải danh sách lớp chính quy");
    }
  };

  const loadLecturers = async () => {
    try {
      const res = await api.get("/admin/users");
      const data = res.data.users || res.data;
      setLecturers(data.filter((u) => u.role === "lecturer"));
    } catch {
      toast.error("Không thể tải danh sách giảng viên");
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get("/admin/users");
      const data = res.data.users || res.data;
      setStudents(data.filter((u) => u.role === "student"));
    } catch {
      toast.error("Không thể tải danh sách sinh viên");
    }
  };

  const reloadSelectedClass = (id) => {
    api
      .get("/admin/official-classes")
      .then((res) => {
        const fresh = res.data.find((c) => c._id === id);
        if (fresh) setSelectedClass(fresh);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadClasses();
    loadLecturers();
    loadStudents();
  }, []);

  /* ==========================================
        SUBMIT FORM (CREATE / UPDATE)
  ========================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.code || !form.major || !form.courseYear) {
      return toast.error("Vui lòng nhập đầy đủ thông tin lớp");
    }

    try {
      if (editingId) {
        await api.put(`/admin/official-classes/${editingId}`, form);
        toast.success("Đã cập nhật lớp chính quy");
      } else {
        await api.post("/admin/official-classes", form);
        toast.success("Đã tạo lớp chính quy");
      }

      resetForm();
      loadClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi xử lý dữ liệu");
    }
  };

  const resetForm = () => {
    setForm({
      code: "",
      major: "",
      courseYear: "",
      advisor: "",
    });
    setEditingId(null);
  };

  /* ==========================================
        EDIT CLASS
  ========================================== */
  const handleEdit = (cls) => {
    setForm({
      code: cls.code,
      major: cls.major,
      courseYear: cls.courseYear,
      advisor: cls.advisor?._id || "",
    });
    setEditingId(cls._id);
  };

  /* ==========================================
        DELETE CLASS
  ========================================== */
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa lớp chính quy này?")) return;

    try {
      await api.delete(`/admin/official-classes/${id}`);
      toast.success("Đã xóa lớp");
      loadClasses();
    } catch {
      toast.error("Không thể xóa lớp");
    }
  };

  /* ==========================================
        OPEN STUDENT MODAL
  ========================================== */
  const openStudentModal = (cls) => {
    setSelectedClass(cls);
    setShowModal(true);
  };

  /* ==========================================
        ADD STUDENT MANUALLY
  ========================================== */
  const getClassById = async (id) => {
  try {
    const res = await api.get(`/admin/official-classes/${id}`);
    setSelectedClass(res.data);
  } catch {}
};
 const handleAddStudent = async () => {
  if (!newStudentId) return toast.error("Chọn sinh viên");

  try {
    await api.post(
      `/admin/official-classes/${selectedClass._id}/students`,
      { studentId: newStudentId }
    );

    toast.success("Đã thêm sinh viên");

    // cập nhật ngay modal
    await getClassById(selectedClass._id);

    // cập nhật danh sách sinh viên rời / chưa thuộc lớp
    loadStudents();
    loadClasses();

    setNewStudentId("");
  } catch (err) {
    toast.error(err.response?.data?.message || "Lỗi thêm sinh viên");
  }
};


  /* ==========================================
        REMOVE STUDENT
  ========================================== */
  const handleRemoveStudent = async (studentId) => {
  if (!window.confirm("Xóa sinh viên này khỏi lớp?")) return;

  try {
    await api.delete(
      `/admin/official-classes/${selectedClass._id}/students/${studentId}`
    );

    toast.success("Đã xóa");

    await getClassById(selectedClass._id);
    loadStudents();
    loadClasses();
  } catch {
    toast.error("Không thể xóa sinh viên");
  }
};


  /* ==========================================
        RENDER
  ========================================== */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý lớp chính quy</h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 border rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Mã lớp (VD: 22DTH2A)"
          className="border rounded-lg p-2"
        />

        <input
          value={form.major}
          onChange={(e) => setForm({ ...form, major: e.target.value })}
          placeholder="Ngành học"
          className="border rounded-lg p-2"
        />

        <input
          type="number"
          value={form.courseYear}
          onChange={(e) => setForm({ ...form, courseYear: e.target.value })}
          placeholder="Khóa (VD: 2022)"
          className="border rounded-lg p-2"
        />

        <select
          value={form.advisor}
          onChange={(e) => setForm({ ...form, advisor: e.target.value })}
          className="border rounded-lg p-2"
        >
          <option value="">Chọn cố vấn</option>
          {lecturers.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name} ({l.email})
            </option>
          ))}
        </select>

        <button className="col-span-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">
          {editingId ? "Cập nhật" : "Thêm mới"}
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Mã lớp</th>
              <th className="p-2 text-left">Ngành</th>
              <th className="p-2 text-left">Khóa</th>
              <th className="p-2 text-left">Cố vấn</th>
              <th className="p-2 text-center">Sĩ số</th>
              <th className="p-2 text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {classes.map((c) => (
              <tr key={c._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{c.code}</td>
                <td className="p-2">{c.major}</td>
                <td className="p-2">{c.courseYear}</td>
                <td className="p-2">{c.advisor?.name || "-"}</td>
                <td className="p-2 text-center">{c.students?.length || 0}</td>

                <td className="p-2 flex justify-center gap-3">
                  <button
                    onClick={() => openStudentModal(c)}
                    className="text-green-600"
                  >
                    <Users size={18} />
                  </button>

                  <button
                    onClick={() => handleEdit(c)}
                    className="text-blue-600"
                  >
                    <Edit3 size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {!classes.length && (
              <tr>
                <td colSpan="6" className="text-center py-6 italic">
                  Chưa có lớp nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL STUDENTS */}
      {showModal && selectedClass && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Sinh viên – {selectedClass.code}
            </h2>

            {/* IMPORT / EXPORT */}
            <div className="flex gap-2 mb-3">
              <ExcelImportButton
                endpoint={`/admin/official-classes/${selectedClass._id}/students/import`}
                onSuccess={(res) => {
                  toast.success("Import thành công");
                  reloadSelectedClass(selectedClass._id);
                  loadClasses();
                }}
              />

              <ExcelExportButton
                endpoint={`/admin/official-classes/${selectedClass._id}/students/export`}
                filename={`${selectedClass.code}_SinhVien.xlsx`}
              />
            </div>

            {/* THÊM THỦ CÔNG */}
<div className="flex gap-2 mb-4">

  {/** Lọc sinh viên chưa có lớp */}
  {(() => {
    const filteredStudents = students.filter((s) => !s.officialClass);

    return (
      <>
        <select
          value={newStudentId}
          onChange={(e) => setNewStudentId(e.target.value)}
          className="border p-2 rounded flex-1"
        >
          <option value="">Chọn sinh viên để thêm</option>

          {filteredStudents.length > 0 ? (
            filteredStudents.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} – {s.name} ({s.email})
              </option>
            ))
          ) : (
            <option value="">Không còn sinh viên nào</option>
          )}
        </select>

        <button
          onClick={handleAddStudent}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Thêm
        </button>
      </>
    );
  })()}
</div>


            {/* TABLE STUDENTS */}
{selectedClass.students?.length ? (
  <table className="w-full text-sm border">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 text-left">Mã SV</th>
        <th className="p-2 text-left">Tên</th>
        <th className="p-2 text-left">Email</th>
        <th className="p-2 text-center">Xóa</th>
      </tr>
    </thead>

    <tbody>
      {selectedClass.students.map((st) => (
        <tr key={st._id} className="border-t hover:bg-gray-50">
          <td className="p-2">{st.code}</td>
          <td className="p-2">{st.name}</td>
          <td className="p-2">{st.email}</td>
          <td className="p-2 text-center">
            <button
              onClick={() => handleRemoveStudent(st._id)}
              className="text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <p className="italic text-gray-500">Chưa có sinh viên</p>
)}


            <div className="text-right mt-5">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedClass(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
