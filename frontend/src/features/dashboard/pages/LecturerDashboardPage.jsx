import React, { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { BookOpen, Users, CalendarCheck, BarChart3 } from "lucide-react";

export default function LecturerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/lecturer/dashboard");
        setStats(res.data);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center mt-10">Không có dữ liệu thống kê</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">📊 Tổng quan giảng viên</h1>

      {/* Cards tổng quan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card icon={<BookOpen />} label="Tổng lớp phụ trách" value={stats.totalClasses} />
        <Card icon={<CalendarCheck />} label="Tổng buổi học" value={stats.totalSessions} />
        <Card icon={<Users />} label="Tổng sinh viên" value={stats.totalStudents} />
        <Card
          icon={<BarChart3 />}
          label="Tỉ lệ điểm danh trung bình"
          value={`${stats.attendanceRate}%`}
        />
      </div>

      {/* Danh sách buổi học gần nhất */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">📅 Buổi học gần nhất</h2>
        {stats.recentSessions.length === 0 ? (
          <p className="text-gray-500">Chưa có buổi học nào.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Lớp</th>
                <th className="p-2 border">Ngày</th>
                <th className="p-2 border">Số SV điểm danh</th>
                <th className="p-2 border">Tỉ lệ (%)</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSessions.map((s) => (
                <tr key={s._id} className="text-center hover:bg-gray-50">
                  <td className="border p-2">{s.className}</td>
                  <td className="border p-2">
                    {new Date(s.date).toLocaleString("vi-VN")}
                  </td>
                  <td className="border p-2">{s.presentCount}</td>
                  <td className="border p-2">{s.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ icon, label, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
      <div className="text-blue-600 mb-2">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-sm text-gray-600 text-center">{label}</div>
    </div>
  );
}
