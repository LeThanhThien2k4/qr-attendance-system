// src/features/attendance/lecturer/pages/LecturerAttendancePage.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";
import {
  BarChart3,
  QrCode,
  Calendar,
  Clock,
  X,
  MapPin,
  StopCircle,
} from "lucide-react";
import AttendanceDetail from "./AttendanceDetail";

export default function LecturerAttendancePage() {
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [qrImage, setQrImage] = useState("");
  const [expireAt, setExpireAt] = useState(null);
  const [countdown, setCountdown] = useState("");

  const [sessionEnded, setSessionEnded] = useState(false);
  const [latestAttendanceId, setLatestAttendanceId] = useState(null);

  const [attendances, setAttendances] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingQR, setLoadingQR] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [showBigQR, setShowBigQR] = useState(false);

  const [openId, setOpenId] = useState(null);
  const [detailData, setDetailData] = useState(null);

  const timerRef = useRef(null);

  /* ============================================================
      CURRENT CLASS
  ============================================================ */
  const currentClass = useMemo(
    () => myClasses.find((c) => c._id === selectedClassId) || null,
    [myClasses, selectedClassId]
  );

  const hasLocation =
    currentClass &&
    currentClass.location &&
    typeof currentClass.location.lat === "number" &&
    typeof currentClass.location.lng === "number";

  const stopCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetQRState = () => {
    stopCountdown();
    setQrImage("");
    setExpireAt(null);
    setCountdown("");
    setLatestAttendanceId(null);
    setSessionEnded(false);
  };

  /* ============================================================
      LOAD DATA
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

  const loadAttendances = async (classId = "") => {
    try {
      const res = await api.get("/lecturer", {
        params: classId ? { classId } : {},
      });
      setAttendances(res.data || []);
    } catch {
      toast.error("Không thể tải lịch sử điểm danh");
    }
  };

  useEffect(() => {
    loadMyClasses();
    loadAttendances();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadAttendances(selectedClassId);
      resetQRState();
    } else {
      resetQRState();
    }
  }, [selectedClassId]);

  /* ============================================================
      AUTO COUNTDOWN + AUTO REFRESH QR
  ============================================================ */
  useEffect(() => {
    if (!expireAt || sessionEnded) {
      stopCountdown();
      return;
    }

    stopCountdown();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const exp = new Date(expireAt).getTime();
      const diff = Math.floor((exp - now) / 1000);

      if (sessionEnded) {
        stopCountdown();
        return;
      }

      if (diff <= 0) {
        stopCountdown();
        handleCreateQR(true); // silent refresh
        return;
      }

      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setCountdown(`${m}m ${s.toString().padStart(2, "0")}s`);

      if (diff <= 3) {
        handleCreateQR(true);
      }
    }, 1000);

    return stopCountdown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expireAt, sessionEnded]);

  /* ============================================================
      TẠO / REFRESH QR
  ============================================================ */
  const handleCreateQR = async (silent = false) => {
    if (!selectedClassId) {
      if (!silent) toast.error("Chọn lớp học phần");
      return;
    }
    if (!hasLocation) {
      if (!silent)
        toast.error("Lớp chưa cập nhật GPS phòng học. Hãy cập nhật trước.");
      return;
    }

    if (!silent) setLoadingQR(true);
    try {
      const res = await api.post("/lecturer", { classId: selectedClassId });

      setQrImage(res.data.qrLink || "");
      setExpireAt(res.data.expireAt || null);
      setLatestAttendanceId(res.data.attendanceId || res.data._id);
      setSessionEnded(false);

      if (!silent) {
        toast.success("Tạo / làm mới QR thành công");
      }

      loadAttendances(selectedClassId);
    } catch (err) {
      if (!silent) {
        toast.error(err.response?.data?.message || "Không thể tạo QR");
      }
    } finally {
      if (!silent) setLoadingQR(false);
    }
  };

  /* ============================================================
      KẾT THÚC PHIÊN
  ============================================================ */
  const handleEndSession = async () => {
    if (!latestAttendanceId) return toast.error("Chưa có phiên để kết thúc");

    if (!window.confirm("Bạn chắc chắn muốn kết thúc phiên điểm danh?")) return;

    try {
      await api.post("/lecturer/end-session", {
        attendanceId: latestAttendanceId,
      });

      setSessionEnded(true);
      stopCountdown();
      setQrImage("");
      setExpireAt(null);
      setCountdown("Đã kết thúc");
      toast.success("Đã kết thúc phiên điểm danh");

      await loadAttendances(selectedClassId);
    } catch {
      toast.error("Không thể kết thúc phiên");
    }
  };

  /* ============================================================
      GPS PHÒNG HỌC
  ============================================================ */
  const handleSetLocation = () => {
    if (!selectedClassId) return toast.error("Chọn lớp học phần");

    setUpdatingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        try {
          await api.post("/lecturer/set-location", {
            classId: selectedClassId,
            lat: latitude,
            lng: longitude,
            radius: 200,
            accuracy,
          });
          toast.success("Đã cập nhật vị trí phòng học!");
          await loadMyClasses();
        } catch (err) {
          toast.error(err.response?.data?.message || "Không thể cập nhật GPS");
        } finally {
          setUpdatingLocation(false);
        }
      },
      () => {
        toast.error("Không thể lấy GPS. Hãy bật Location và cấp quyền.");
        setUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  /* ============================================================
      CHI TIẾT BUỔI ĐIỂM DANH
  ============================================================ */
  const toggleDetail = async (id) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    try {
      const res = await api.get(`/lecturer/attendance/${id}/detail`);
      setDetailData(res.data);
      setOpenId(id);
    } catch {
      toast.error("Không thể tải chi tiết buổi điểm danh");
    }
  };

  /* ============================================================
      RENDER
  ============================================================ */
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Calendar /> Điểm danh – Giảng viên
      </h1>

      {/* SELECT CLASS + ACTION BUTTONS */}
      <div className="bg-white p-4 rounded-xl shadow border space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {loadingClasses ? (
            <p>Đang tải lớp học...</p>
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
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

          {/* Tạo / làm mới QR */}
          <button
            onClick={() => handleCreateQR(false)}
            disabled={loadingQR || !hasLocation || !selectedClassId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white
              ${
                !selectedClassId || !hasLocation
                  ? "bg-gray-400 cursor-not-allowed"
                  : loadingQR
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              }`}
          >
            <QrCode size={18} />
            {loadingQR ? "Đang tạo..." : "Tạo / làm mới QR"}
          </button>

          {/* Kết thúc phiên */}
          <button
            onClick={handleEndSession}
            disabled={!latestAttendanceId || sessionEnded}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <StopCircle size={18} />
            Kết thúc phiên
          </button>

          {/* Cập nhật GPS */}
          <button
            onClick={handleSetLocation}
            disabled={!selectedClassId || updatingLocation}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white
              ${
                !selectedClassId
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            <MapPin size={18} />
            {updatingLocation ? "Đang cập nhật..." : "Cập nhật GPS phòng học"}
          </button>
        </div>

        {selectedClassId && (
          <div className="text-sm text-gray-700">
            <span className="font-medium">Trạng thái GPS lớp: </span>
            {hasLocation ? (
              <div className="text-green-600">
                <div>
                  ĐÃ CÀI ĐẶT (lat: {currentClass.location.lat.toFixed(6)}, lng:{" "}
                  {currentClass.location.lng.toFixed(6)}, r ≈{" "}
                  {currentClass.location.radius || 200}m)
                </div>
                {currentClass.location.accuracy && (
                  <div className="text-blue-600 mt-1">
                    Độ chính xác GPS: ±
                    {currentClass.location.accuracy.toFixed(1)}m
                  </div>
                )}
              </div>
            ) : (
              <span className="text-red-600">
                CHƯA CÀI ĐẶT – hãy cập nhật GPS trước khi tạo QR
              </span>
            )}
          </div>
        )}
      </div>

      {/* QR DISPLAY */}
      {qrImage && !sessionEnded && (
        <div
          className="bg-white p-5 rounded-xl border shadow w-fit cursor-pointer"
          onClick={() => setShowBigQR(true)}
        >
          <img src={qrImage} className="w-48 h-48 mx-auto" alt="QR Code" />
          <div className="mt-3 text-center flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>
              Hết hạn sau: <strong>{countdown}</strong>
            </span>
          </div>
          <p className="text-center text-blue-600 text-sm mt-2">
            Nhấp để phóng to mã QR
          </p>
        </div>
      )}

      {/* MODAL QR */}
      {showBigQR && qrImage && (
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
            <img src={qrImage} className="w-[350px] h-[350px]" alt="QR Code" />
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
              <th className="p-2 text-left">Môn học</th>
              <th className="p-2 text-left">Ngày</th>
              <th className="p-2 text-left">Có mặt</th>
              <th className="p-2 text-left">Vắng</th>
              <th className="p-2 text-left"></th>
            </tr>
          </thead>

          <tbody>
            {attendances.length ? (
              attendances.map((att) => (
                <React.Fragment key={att._id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-2">{att.classId?.code}</td>
                    <td className="p-2">{att.classId?.course?.name || "—"}</td>
                    <td className="p-2">
                      {new Date(att.date).toLocaleString("vi-VN")}
                    </td>
                    <td className="p-2 text-green-600 font-semibold">
                      {att.presentCount}
                    </td>
                    <td className="p-2 text-red-600 font-semibold">
                      {att.absentCount}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => toggleDetail(att._id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          openId === att._id
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                        }`}
                      >
                        {openId === att._id ? "Ẩn" : "Chi tiết"}
                      </button>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={6} className="p-0">
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${
                          openId === att._id
                            ? "max-h-[1000px] opacity-100 translate-y-0"
                            : "max-h-0 opacity-0 -translate-y-2"
                        }`}
                      >
                        <div className="p-4 bg-gray-50 border-t rounded-b-xl shadow-sm">
                          <AttendanceDetail
                            attendanceId={att._id}
                            detail={detailData}
                            reload={() => loadAttendances(selectedClassId)}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
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
