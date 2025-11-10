import React, { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { CalendarPlus, MapPin, QrCode } from "lucide-react";
import toast from "react-hot-toast";

export default function LecturerClassesPage() {
  const [classes, setClasses] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ classId: "", date: "", radius: 50 });
  const [coords, setCoords] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, dataUrl: "", sessionId: "" });

  const loadClasses = async () => {
    try {
      const res = await api.get("/classes/my");
      setClasses(res.data);
    } catch (err) {
      console.error("❌ Lỗi tải lớp:", err.message);
      toast.error("Không thể tải danh sách lớp");
    }
  };

  useEffect(() => {
    loadClasses();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => setCoords(null),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
      );
    }
  }, []);

  const submitCreate = async () => {
    if (!form.classId || !form.date || !coords) {
      toast.error("Vui lòng nhập đầy đủ thông tin và bật GPS!");
      return;
    }
    try {
      const payload = {
        classId: form.classId,
        date: form.date,
        gpsLocation: { lat: coords.lat, lng: coords.lng, radius: Number(form.radius || 50) },
      };
      const res = await api.post("/attendance/session", payload);
      toast.success("Tạo buổi học thành công!");
      setQrModal({
        open: true,
        dataUrl: res.data.qrDataUrl,
        sessionId: res.data.session._id,
      });
      setCreating(false);
    } catch (err) {
      toast.error("Lỗi khi tạo buổi học");
      console.error(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Lớp phụ trách</h1>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <CalendarPlus size={18} /> Tạo buổi học
        </button>
      </div>

      {/* Danh sách lớp */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => (
          <div key={c._id} className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="font-semibold text-lg">{c.code} — {c.name}</div>
            <div className="text-sm text-gray-600">Học kỳ: {c.semester}</div>
            <button
              onClick={() => setForm({ ...form, classId: c._id }) || setCreating(true)}
              className="mt-3 text-blue-600 hover:underline inline-flex items-center gap-2"
            >
              <QrCode size={16} /> Tạo buổi học cho lớp này
            </button>
          </div>
        ))}
      </div>

      {/* Modal tạo buổi */}
      {creating && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Tạo buổi học</h3>

            <label className="block text-sm mb-1">Chọn lớp</label>
            <select
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              className="w-full border rounded p-2 mb-3"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>

            <label className="block text-sm mb-1">Ngày giờ</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border rounded p-2 mb-3"
            />

            <label className="block text-sm mb-1">Bán kính GPS (m)</label>
            <input
              type="number"
              value={form.radius}
              onChange={(e) => setForm({ ...form, radius: e.target.value })}
              className="w-full border rounded p-2 mb-3"
            />

            <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
              <MapPin size={16} />
              {coords ? (
                <span>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
              ) : (
                <span>Chưa lấy được vị trí</span>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCreating(false)}
                className="px-3 py-2 rounded bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={submitCreate}
                className="px-3 py-2 rounded bg-blue-600 text-white"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrModal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-center">
              Mã QR buổi học
            </h3>
            <img src={qrModal.dataUrl} alt="QR" className="mx-auto w-64 h-64" />
            <p className="text-center text-sm text-gray-600 mt-2">
              Session ID: {qrModal.sessionId}
            </p>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setQrModal({ open: false, dataUrl: "", sessionId: "" })}
                className="px-4 py-2 bg-blue-600 text-white rounded"
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
