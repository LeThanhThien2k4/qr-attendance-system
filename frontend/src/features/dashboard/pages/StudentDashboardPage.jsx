import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/axios";

const arr = (v) => (Array.isArray(v) ? v : []);

export default function StudentDashboardPage() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/student/dashboard");
        if (!active) return;
        setStats(data || {});
      } catch (e) {
        console.error("Student dashboard error:", e);
        if (active)
          setErr(e?.response?.data?.message || e.message || "Load dashboard failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const classStats = useMemo(() => arr(stats.classStats), [stats]);
  const recent = useMemo(() => arr(stats.recentAttendances), [stats]);
  const todaySessions = useMemo(() => arr(stats.todaySessions), [stats]);

  const totalClasses = stats?.totalClasses ?? classStats.length ?? 0;
  const totalSessions = stats?.totalSessions ?? 0;
  const presentTotal = stats?.presentTotal ?? 0;
  const absentTotal = stats?.absentTotal ?? 0;

  const attendanceRate =
    presentTotal + absentTotal > 0
      ? ((presentTotal / (presentTotal + absentTotal)) * 100).toFixed(1)
      : "0.0";

  if (loading) return <div className="p-6">Đang tải thống kê...</div>;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-semibold mb-2">Tổng quan sinh viên</h2>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard label="Lớp đang học" value={totalClasses} />
        <SummaryCard label="Buổi đã điểm danh" value={totalSessions} />
        <SummaryCard label="Có mặt" value={presentTotal} color="text-green-600" />
        <SummaryCard label="Vắng" value={absentTotal} color="text-red-600" />
      </div>

      {/* ATTENDANCE RATE */}
      <div className="bg-white rounded-xl p-4 shadow border">
        <h3 className="font-semibold mb-3">Tỷ lệ chuyên cần tổng</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-green-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <div className="text-lg font-semibold">{attendanceRate}%</div>
        </div>
      </div>

      {/* TODAY SESSIONS */}
      <Section title="Buổi học trong ngày">
        {todaySessions.length === 0 ? (
          <Empty text="Hôm nay chưa có buổi điểm danh nào." />
        ) : (
          <ul className="space-y-2">
            {todaySessions.map((s, i) => (
              <li
                key={i}
                className="flex justify-between items-center p-3 bg-blue-50 border rounded"
              >
                <div>
                  <div className="font-semibold">
                    {s.className || "-"} – {s.courseName || "-"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {s.date
                      ? new Date(s.date).toLocaleTimeString("vi-VN")
                      : ""}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* CLASS STATS */}
      <Section title="Thống kê chuyên cần theo lớp">
        {classStats.length === 0 ? (
          <Empty text="Chưa có dữ liệu điểm danh." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Lớp</th>
                  <th className="p-2 border">Môn</th>
                  <th className="p-2 border">Buổi</th>
                  <th className="p-2 border">Có mặt</th>
                  <th className="p-2 border">Vắng</th>
                  <th className="p-2 border">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map((c, i) => (
                  <tr key={i}>
                    <td className="p-2 border">{c.className || "-"}</td>
                    <td className="p-2 border">{c.courseName || "-"}</td>
                    <td className="p-2 border">{c.totalSessions || 0}</td>
                    <td className="p-2 border text-green-600">
                      {c.present || 0}
                    </td>
                    <td className="p-2 border text-red-600">{c.absent || 0}</td>
                    <td className="p-2 border">
                      {(c.attendanceRate ?? 0).toFixed
                        ? c.attendanceRate.toFixed(1) + "%"
                        : `${c.attendanceRate || 0}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* RECENT ATTENDANCES */}
      <Section title="Lịch sử điểm danh gần đây">
        {recent.length === 0 ? (
          <Empty text="Chưa có lịch sử điểm danh." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Lớp</th>
                  <th className="p-2 border">Môn</th>
                  <th className="p-2 border">Thời gian</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i}>
                    <td className="p-2 border">{r.className || "-"}</td>
                    <td className="p-2 border">{r.courseName || "-"}</td>
                    <td className="p-2 border">
                      {r.date
                        ? new Date(r.date).toLocaleString("vi-VN")
                        : "-"}
                    </td>
                    <td className="p-2 border">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ===== Sub components ===== */

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color || ""}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow border space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-gray-500">{text}</p>;
}

function StatusBadge({ status }) {
  let text = "Không rõ";
  let cls = "bg-gray-100 text-gray-700";

  if (status === "present") {
    text = "Có mặt";
    cls = "bg-green-100 text-green-700";
  } else if (status === "absent") {
    text = "Vắng";
    cls = "bg-red-100 text-red-700";
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}
