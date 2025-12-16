import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/axios";

import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const ROLE_COLORS = {
  admin: "#6366F1",
  lecturer: "#22C55E",
  student: "#3B82F6",
};

const ATT_COLORS = {
  present: "#22C55E",
  absent: "#EF4444",
};

export default function AdminDashboardPage() {
  const CURRENT_YEAR = new Date().getFullYear();
  const [year, setYear] = useState(CURRENT_YEAR);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

useEffect(() => {
  let alive = true;

  (async () => {
    try {
      setLoading(true);
      setErr("");

      const { data } = await api.get("/admin/dashboard", {
        params: { year },
      });

      if (!alive) return;
      setStats(data);
    } catch (e) {
      if (!alive) return;
      setErr(e?.response?.data?.message || e.message);
    } finally {
      if (alive) setLoading(false);
    }
  })();

  return () => {
    alive = false;
  };
}, [year]); // ✅ BẮT BUỘC


  /* ----------- Pie: User Role ----------- */
  const roleSeries = useMemo(() => {
    if (!stats?.userByRole) return [];
    return stats.userByRole.map((r) => ({
      name: r._id,
      value: r.count,
      color: ROLE_COLORS[r._id] || "#94A3B8",
    }));
  }, [stats]);

  /* ----------- Monthly Line Chart ----------- */
  const monthlySeries = useMemo(() => {
    const base = Array.from({ length: 12 }, (_, i) => ({
      month: `T${i + 1}`,
      present: 0,
      absent: 0,
    }));

    if (!stats?.attendanceMonthly) return base;

    stats.attendanceMonthly.forEach((m) => {
      const idx = m._id - 1; // _id = month number
      if (idx >= 0 && idx < 12) {
        base[idx].present = m.present;
        base[idx].absent = m.absent;
      }
    });

    return base;
  }, [stats]);


  /* ----------- Attendance By Class ----------- */
  const classSeries = useMemo(() => {
    if (!stats?.attendanceByClass) return [];
    return stats.attendanceByClass.map((c) => ({
      className: c.className,
      present: c.present,
      absent: c.absent,
    }));
  }, [stats]);

  /* ----------- Overall Attendance Pie ----------- */
  const attendancePie = useMemo(() => {
    if (!stats?.attendanceSummary) return [];
    return [
      {
        name: "Có mặt",
        value: stats.attendanceSummary.present,
        color: ATT_COLORS.present,
      },
      {
        name: "Vắng",
        value: stats.attendanceSummary.absent,
        color: ATT_COLORS.absent,
      },
    ];
  }, [stats]);

  if (loading) return <div className="p-6">Đang tải thống kê...</div>;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;

  return (
    <div className="p-6 space-y-8">
      {/* ================= TOP CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Tổng người dùng" value={stats?.totalUsers || 0} />
        <StatCard
          label="Admin"
          value={stats?.userByRole?.find((x) => x._id === "admin")?.count || 0}
        />
        <StatCard
          label="Giảng viên"
          value={stats?.userByRole?.find((x) => x._id === "lecturer")?.count || 0}
        />
        <StatCard
          label="Sinh viên"
          value={stats?.userByRole?.find((x) => x._id === "student")?.count || 0}
        />
      </div>

      {/* ================= 2 PIE CHARTS FLEX ================= */}
      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[320px]">
          <ChartCard title="Tỷ lệ theo vai trò" legend={roleSeries}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleSeries} dataKey="value" innerRadius={50} outerRadius={110}>
                  {roleSeries.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="flex-1 min-w-[320px]">
          <ChartCard title="Tỷ lệ có mặt / vắng toàn hệ thống" legend={attendancePie}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendancePie} dataKey="value" innerRadius={50} outerRadius={110}>
                  {attendancePie.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* ================= FULL WIDTH MONTHLY ================= */}
      <ChartCardWide title={`Chuyên cần theo tháng - Năm ${year}`}>
        <div className="flex justify-end mb-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-1 text-sm"
          >
            {[CURRENT_YEAR+1,CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlySeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <RTooltip />

            <Line
              type="monotone"
              dataKey="present"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />

            <Line
              type="monotone"
              dataKey="absent"
              stroke="#EF4444"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCardWide>


      {/* ================= FULL WIDTH CLASS BAR ================= */}
      <ChartCardWide title="Chuyên cần theo lớp">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={classSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="className" />
            <YAxis allowDecimals={false} />
            <RTooltip />
            <Bar dataKey="present" fill="#22C55E" />
            <Bar dataKey="absent" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCardWide>

      {/* ================= TOP ABSENT STUDENTS ================= */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <h3 className="font-semibold mb-4">Top sinh viên vắng nhiều nhất</h3>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Sinh viên</th>
              <th className="py-2">Lớp</th>
              <th className="py-2">Số buổi vắng</th>
            </tr>
          </thead>
          <tbody>
            {stats?.topAbsentStudents?.map((s, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{s.name}</td>
                <td className="py-2">{s.className || "-"}</td>
                <td className="py-2 text-red-600 font-semibold">{s.absentCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ====================================================== */
/* COMPONENTS */
/* ====================================================== */

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, children, legend }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow border h-[420px] flex flex-col">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="flex-1">{children}</div>

      {legend && (
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {legend.map((e, idx) => (
            <LegendDot key={idx} color={e.color} text={`${e.name} (${e.value})`} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCardWide({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow border h-[430px]">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function LegendDot({ color, text }) {
  return (
    <div className="flex items-center gap-2 text-sm whitespace-nowrap">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
      <span>{text}</span>
    </div>
  );
}
