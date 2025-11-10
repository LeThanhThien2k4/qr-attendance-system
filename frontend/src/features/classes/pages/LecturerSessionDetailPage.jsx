import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../lib/axios";
import { Users } from "lucide-react";

export default function LecturerSessionDetailPage() {
  const { id } = useParams(); // sessionId
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      const res = await api.get(`/attendance/session/${id}`);
      setData(res.data);
    } catch (err) {
      console.error("❌ Lỗi tải buổi học:", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!data) return <div className="p-6">Đang tải...</div>;

  const { session, records } = data;
  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const late = records.filter((r) => r.status === "LATE").length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Users className="text-blue-600" />
        <h1 className="text-2xl font-semibold">Chi tiết buổi học</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <h2 className="font-semibold text-lg mb-2">
          {session.classId?.code} — {session.classId?.name}
        </h2>
        <p>Ngày: {new Date(session.date).toLocaleString()}</p>
        <p>Giảng viên: {session.lecturerId?.fullName}</p>
        <p>
          Vị trí lớp: {session.gpsLocation?.lat}, {session.gpsLocation?.lng} (Bán kính{" "}
          {session.gpsLocation?.radius}m)
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="p-3 rounded bg-gray-100">Tổng: <b>{total}</b></div>
        <div className="p-3 rounded bg-green-100">Có mặt: <b>{present}</b></div>
        <div className="p-3 rounded bg-red-100">Vắng: <b>{absent}</b></div>
        {late > 0 && <div className="p-3 rounded bg-yellow-100">Trễ: <b>{late}</b></div>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">MSSV</th>
              <th className="p-2 border">Họ tên</th>
              <th className="p-2 border">Trạng thái</th>
              <th className="p-2 border">Thời gian</th>
              <th className="p-2 border">Khoảng cách (m)</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="p-2 border">{r.studentId?.studentCode}</td>
                <td className="p-2 border">{r.studentId?.fullName}</td>
                <td
                  className={`p-2 border font-semibold ${
                    r.status === "PRESENT"
                      ? "text-green-600"
                      : r.status === "ABSENT"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {r.status}
                </td>
                <td className="p-2 border">
                  {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "-"}
                </td>
                <td className="p-2 border text-center">
                  {r.distance ? Math.round(r.distance) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
