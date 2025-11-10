
// src/features/dashboard/pages/StudentDashboardPage.jsx
import React, { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { BookOpen, Calendar, CheckCircle } from "lucide-react";

export default function StudentDashboardPage() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    attendedSessions: 0,
    upcomingSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Gọi API backend thật (sau này bạn thêm endpoint riêng cho student)
        // Ví dụ: GET /api/student/dashboard
        // Tạm mock dữ liệu test:
        setTimeout(() => {
          setStats({
            totalClasses: 6,
            attendedSessions: 18,
            upcomingSessions: 3,
          });
          setLoading(false);
        }, 600);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err.message);
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className="text-center p-10">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Bảng điều khiển sinh viên</h1>

      {/* --- Thẻ thống kê --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<BookOpen size={28} className="text-blue-500" />}
          label="Số lớp đang học"
          value={stats.totalClasses}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle size={28} className="text-green-500" />}
          label="Buổi đã điểm danh"
          value={stats.attendedSessions}
          color="green"
        />
        <StatCard
          icon={<Calendar size={28} className="text-yellow-500" />}
          label="Buổi sắp tới"
          value={stats.upcomingSessions}
          color="yellow"
        />
      </div>

      {/* --- Danh sách buổi học sắp tới (mock) --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Buổi học sắp tới</h2>
        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-2">Môn học</th>
              <th className="text-left py-2">Ngày học</th>
              <th className="text-left py-2">Giờ học</th>
              <th className="text-left py-2">Phòng</th>
            </tr>
          </thead>
          <tbody>
            {[
              { subject: "Lập trình Web", date: "12/11/2025", time: "07:00 - 09:30", room: "P.A203" },
              { subject: "Cơ sở dữ liệu", date: "13/11/2025", time: "09:40 - 12:10", room: "P.B105" },
              { subject: "Mạng máy tính", date: "14/11/2025", time: "13:00 - 15:30", room: "P.C204" },
            ].map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="py-2">{item.subject}</td>
                <td>{item.date}</td>
                <td>{item.time}</td>
                <td>{item.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 border">
      <div className={`p-3 rounded-lg bg-${color}-100`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
