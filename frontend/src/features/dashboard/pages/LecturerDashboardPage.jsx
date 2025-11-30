// src/features/lecturer/pages/LecturerDashboardPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function LecturerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/lecturer/dashboard");
        if (!alive) return;
        setStats(data);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Không tải được dữ liệu");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const classSeries = useMemo(() => {
    if (!stats?.classStats) return [];
    return stats.classStats.map((c) => ({
      classCode: c.classCode || "N/A",
      attendanceRate: Number(c.attendanceRate?.toFixed?.(1) ?? c.attendanceRate ?? 0),
    }));
  }, [stats]);

  if (loading) return <div className="p-6">Đang tải thống kê...</div>;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!stats) return <div className="p-6">Không có dữ liệu thống kê</div>;

  const { summary, todaySessions, recentAttendances, lowAttendanceClasses } = stats;

  return (
    <div className="p-6 space-y-8">
      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Lớp phụ trách" value={summary?.totalClasses ?? 0} />
        <StatCard label="Buổi điểm danh đã tạo" value={summary?.totalSessions ?? 0} />
        <StatCard label="Tổng có mặt" value={summary?.totalPresent ?? 0} />
        <StatCard
          label="Tỉ lệ chuyên cần TB"
          value={
            summary?.attendanceRate != null
              ? `${summary.attendanceRate}%`
              : "0%"
          }
        />
      </div>

      {/* ================= TODAY SESSIONS ================= */}
      <div className="bg-white rounded-xl shadow border p-4">
        <h3 className="font-semibold mb-3">Buổi điểm danh hôm nay</h3>
        {todaySessions && todaySessions.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="border-b">
              <tr>
                <th className="py-2">Lớp</th>
                <th className="py-2">Thời gian</th>
                <th className="py-2">Có mặt</th>
                <th className="py-2">Vắng</th>
              </tr>
            </thead>
            <tbody>
              {todaySessions.map((a) => (
                <tr key={a._id} className="border-b">
                  <td className="py-2">
                    {a.classId?.code} – {a.classId?.name}
                  </td>
                  <td className="py-2">
                    {new Date(a.date).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-2 text-green-600 font-semibold">
                    {a.presentCount}
                  </td>
                  <td className="py-2 text-red-600 font-semibold">
                    {a.absentCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">
            Hôm nay chưa có buổi điểm danh nào.
          </p>
        )}
      </div>

      {/* ================= CLASS ATTENDANCE CHART ================= */}
      <div className="bg-white rounded-xl shadow border p-4">
        <h3 className="font-semibold mb-4">Tỉ lệ chuyên cần theo lớp (%)</h3>
        {classSeries.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={classSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="classCode" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <RTooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="attendanceRate" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm">
            Chưa có dữ liệu chuyên cần theo lớp.
          </p>
        )}
      </div>

      {/* ================= LOW ATTENDANCE CLASSES ================= */}
      <div className="bg-white rounded-xl shadow border p-4">
        <h3 className="font-semibold mb-3">Lớp có chuyên cần thấp (&lt; 60%)</h3>
        {lowAttendanceClasses && lowAttendanceClasses.length > 0 ? (
          <ul className="list-disc pl-5 text-sm space-y-1">
            {lowAttendanceClasses.map((c) => (
              <li key={c.classId}>
                <span className="font-medium">
                  {c.classCode} – {c.className}
                </span>{" "}
                – {c.attendanceRate.toFixed(1)}%
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">
            Không có lớp nào dưới 60% chuyên cần.
          </p>
        )}
      </div>

      {/* ================= RECENT ATTENDANCES ================= */}
      <div className="bg-white rounded-xl shadow border p-4">
        <h3 className="font-semibold mb-3">Lịch sử điểm danh gần nhất</h3>
        {recentAttendances && recentAttendances.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="border-b">
              <tr>
                <th className="py-2">Lớp</th>
                <th className="py-2">Ngày</th>
                <th className="py-2">Có mặt</th>
                <th className="py-2">Vắng</th>
              </tr>
            </thead>
            <tbody>
              {recentAttendances.map((a) => (
                <tr key={a._id} className="border-b">
                  <td className="py-2">
                    {a.classId?.code} – {a.classId?.name}
                  </td>
                  <td className="py-2">
                    {new Date(a.date).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-2 text-green-600 font-semibold">
                    {a.presentCount}
                  </td>
                  <td className="py-2 text-red-600 font-semibold">
                    {a.absentCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">
            Chưa có lịch sử điểm danh.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
