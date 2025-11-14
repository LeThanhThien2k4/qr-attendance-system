import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { UserCheck, UserX, MapPin, Clock } from "lucide-react";

export default function LecturerAttendanceDetailPage() {
  const { id } = useParams();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = async () => {
    try {
      const res = await api.get(`/lecturer/attendances/${id}`);
      setAttendance(res.data);
    } catch (err) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  if (!attendance)
    return (
      <div className="p-6 text-center text-gray-500">
        Không tìm thấy dữ liệu
      </div>
    );

  const cls = attendance.classId;

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold mb-4">
        Chi tiết buổi điểm danh – {cls?.name}
      </h1>

      {/* Info card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow">
          <p className="text-gray-500">Môn học</p>
          <p className="font-semibold text-lg">{cls?.course?.name}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow">
          <p className="text-gray-500">Ngày / Giờ</p>
          <p className="font-semibold">
            {new Date(attendance.date).toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow">
          <p className="text-gray-500">Trạng thái QR</p>
          <p
            className={
              new Date() > new Date(attendance.expireAt)
                ? "text-red-600 font-semibold"
                : "text-green-600 font-semibold"
            }
          >
            {new Date() > new Date(attendance.expireAt)
              ? "Đã hết hạn"
              : "Đang hoạt động"}
          </p>
        </div>
      </div>

      {/* ============================
          DANH SÁCH ĐÃ ĐIỂM DANH
      ============================ */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <UserCheck className="text-green-600" /> Đã điểm danh (
          {attendance.presentCount})
        </h2>

        <div className="bg-white border rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">MSSV</th>
                <th className="p-2">Tên</th>
                <th className="p-2">Thời gian</th>
                <th className="p-2">Thiết bị</th>
                <th className="p-2">GPS</th>
              </tr>
            </thead>

            <tbody>
              {attendance.studentsPresent.map((item, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-2">{item.studentId.code}</td>
                  <td className="p-2">{item.studentId.name}</td>
                  <td className="p-2">
                    <Clock size={14} className="inline mr-1" />
                    {new Date(item.checkInTime).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-2 text-gray-700">
                    {item.device?.platform || "Không rõ"}
                  </td>
                  <td className="p-2">
                    {item.gps?.lat ? (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-blue-600" />
                        {item.gps.lat.toFixed(4)}, {item.gps.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        Không có GPS
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {!attendance.studentsPresent.length && (
                <tr>
                  <td colSpan="5" className="text-center p-4 text-gray-400">
                    Chưa có sinh viên nào điểm danh
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================
          DANH SÁCH VẮNG
      ============================ */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <UserX className="text-red-600" /> Vắng mặt (
          {attendance.absentCount})
        </h2>

        <div className="bg-white border rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">MSSV</th>
                <th className="p-2">Tên</th>
                <th className="p-2">Email</th>
              </tr>
            </thead>

            <tbody>
              {attendance.studentsAbsent.map((st) => (
                <tr key={st._id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{st.code}</td>
                  <td className="p-2">{st.name}</td>
                  <td className="p-2">{st.email}</td>
                </tr>
              ))}

              {!attendance.studentsAbsent.length && (
                <tr>
                  <td colSpan="3" className="text-center p-4 text-gray-400">
                    Không có sinh viên vắng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================
          BẢN ĐỒ GPS – Leaflet
      ============================ */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Bản đồ vị trí GPS</h2>

        <div className="bg-white border rounded-lg shadow p-2">
          <MapContainer
            center={[10.762622, 106.660172]} // default: HCM
            zoom={14}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {attendance.studentsPresent
              .filter((s) => s.gps?.lat)
              .map((s, i) => (
                <Marker
                  key={i}
                  position={[s.gps.lat, s.gps.lng]}
                >
                  <Popup>
                    <b>{s.studentId.name}</b>
                    <br />
                    {s.gps.lat.toFixed(4)}, {s.gps.lng.toFixed(4)}
                    <br />
                    {new Date(s.checkInTime).toLocaleString("vi-VN")}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
