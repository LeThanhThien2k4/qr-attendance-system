// src/features/attendance/lecturer/pages/LecturerAttendancePage.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";
import { BarChart3, QrCode, Calendar, Clock, X, MapPin } from "lucide-react";

export default function LecturerAttendancePage() {
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [expireAt, setExpireAt] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [attendances, setAttendances] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingQR, setLoadingQR] = useState(false);
  const [showBigQR, setShowBigQR] = useState(false);

  const timerRef = useRef(null);

  /* ============================================================
      ⏳ COUNTDOWN
  ============================================================ */
  const startCountdown = (expireTime) => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const diff = expireTime - now;

      if (diff <= 0) {
        setCountdown("Hết hạn");
        clearInterval(timerRef.current);
        return;
      }

      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${m}m ${s}s`);
    }, 1000);
  };

  /* ============================================================
      📌 LOAD CLASSES
  ============================================================ */
  const loadMyClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await api.get("/lecturer/classes");
      setMyClasses(res.data || []);
    } catch {
      toast.error("Không thể tải lớp học phần");
    } finally {
      setLoadingClasses(false);
    }
  };

  /* ============================================================
      📘 LOAD ATTENDANCE HISTORY
  ============================================================ */
  const loadAttendances = async () => {
    try {
      const res = await api.get("/lecturer");
      setAttendances(res.data || []);
    } catch {
      toast.error("Không thể tải lịch sử điểm danh");
    }
  };

  useEffect(() => {
    loadMyClasses();
    loadAttendances();
  }, []);

  /* ============================================================
      🟩 TẠO QR
  ============================================================ */
  const handleCreateQR = async () => {
    if (!selectedClass) return toast.error("Chọn lớp học phần");

    setLoadingQR(true);
    try {
      const res = await api.post("/lecturer", { classId: selectedClass });

      setQrImage(res.data.qrLink || "");
      setExpireAt(res.data.expireAt || null);

      if (res.data?.expireAt) {
        startCountdown(new Date(res.data.expireAt).getTime());
      }

      toast.success("Tạo QR thành công");
      loadAttendances();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tạo QR");
    } finally {
      setLoadingQR(false);
    }
  };

  /* ============================================================
      📍 CẬP NHẬT GPS PHÒNG HỌC
  ============================================================ */
 const handleSetLocation = () => {
  if (!selectedClass) return toast.error("Chọn lớp học phần");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      try {
        await api.post("/lecturer/set-location", {
          classId: selectedClass,
          lat,
          lng,
          radius: 200 // bạn có thể đổi 300–500 khi test
        });

        toast.success("Đã cập nhật vị trí phòng học!");
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể cập nhật GPS phòng học");
      }
    },
    (err) => {
      console.error(err);
      toast.error("Không thể lấy GPS. Hãy bật Location + cấp quyền vị trí!");
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    }
  );
};

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Calendar /> Điểm danh – Giảng viên
      </h1>

      {/* CLASS SELECT */}
      <div className="flex gap-3 items-center bg-white p-4 rounded-xl shadow border">
        {loadingClasses ? (
          <p>Đang tải lớp học...</p>
        ) : (
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-[250px]"
          >
            <option value="">-- Chọn lớp học phần --</option>
            {myClasses.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.code} – {cls.course?.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleCreateQR}
          disabled={loadingQR}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
            loadingQR
              ? "bg-gray-400"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          <QrCode size={18} />
          {loadingQR ? "Đang tạo..." : "Tạo QR"}
        </button>

        <button
          onClick={handleSetLocation}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <MapPin size={18} />
          Cập nhật GPS phòng học
        </button>
      </div>

      {/* QR SHOW */}
      {qrImage && (
        <div
          className="bg-white p-5 rounded-xl border shadow w-fit cursor-pointer"
          onClick={() => setShowBigQR(true)}
        >
          <img src={qrImage} className="w-48 h-48 mx-auto" />

          <div className="mt-3 text-center flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            {countdown === "Hết hạn" ? (
              <span className="text-red-500 font-semibold">QR đã hết hạn</span>
            ) : (
              <span>
                Hết hạn sau: <strong>{countdown}</strong>
              </span>
            )}
          </div>

          <p className="text-center text-blue-600 text-sm mt-2">
            Nhấp để phóng to mã QR
          </p>
        </div>
      )}

      {/* MODAL QR */}
      {showBigQR && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={() => setShowBigQR(false)}
        >
          <div
            className="bg-white p-4 rounded-xl shadow relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
              onClick={() => setShowBigQR(false)}
            >
              <X size={24} />
            </button>

            <img src={qrImage} className="w-[350px] h-[350px]" />
          </div>
        </div>
      )}

      {/* HISTORY */}
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 /> Lịch sử điểm danh
      </h2>

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Lớp</th>
              <th className="p-2 text-left">Ngày</th>
              <th className="p-2 text-left">Có mặt</th>
              <th className="p-2 text-left">Vắng</th>
            </tr>
          </thead>

          <tbody>
            {attendances.length ? (
              attendances.map((att) => (
                <tr key={att._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{att.classId?.name}</td>
                  <td className="p-2">
                    {new Date(att.date).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-2 text-green-600 font-semibold">
                    {att.presentCount}
                  </td>
                  <td className="p-2 text-red-600 font-semibold">
                    {att.absentCount}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-gray-500"
                >
                  Chưa có buổi điểm danh nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
