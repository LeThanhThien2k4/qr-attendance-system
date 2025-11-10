import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/axios";
// recharts
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const ROLE_COLORS = {
  admin: "#6366F1",
  lecturer: "#22C55E",
  student: "#3B82F6",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/users/stats");
        if (!alive) return;
        setStats(data);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Load stats failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const roleSeries = useMemo(() => {
    if (!stats?.byRole) return [];
    // stats.byRole: [{_id:"ADMIN", count: x}, ...]
    return stats.byRole.map((r) => ({
      name: r._id,
      value: r.count,
      color: ROLE_COLORS[r._id] || "#94A3B8",
    }));
  }, [stats]);

  const yearSeries = useMemo(() => {
    if (!stats?.byYear) return [];
    // stats.byYear: [{_id: 2025, count: x}, ...]
    return stats.byYear
      .filter((y) => y._id) // bỏ null
      .map((y) => ({ year: String(y._id), count: y.count }))
      .slice(0, 8); // tránh quá dài
  }, [stats]);

  if (loading)
    return (
      <div className="p-6">
        <p>Đang tải thống kê...</p>
      </div>
    );

  if (err)
    return (
      <div className="p-6">
        <p className="text-red-600">Lỗi: {err}</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Top number cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Tổng người dùng" value={stats?.total ?? 0} />
        <StatCard
          label="Admin"
          value={stats?.byRole?.find((x) => x._id === "admin")?.count || 0}
        />
        <StatCard
          label="Giảng viên"
          value={stats?.byRole?.find((x) => x._id === "lecturer")?.count || 0}
        />
        <StatCard
          label="Sinh viên"
          value={stats?.byRole?.find((x) => x._id === "student")?.count || 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 shadow border">
          <h3 className="font-semibold mb-3">Tỷ lệ theo vai trò</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleSeries}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  innerRadius={50}
                >
                  {roleSeries.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {roleSeries.map((e) => (
              <LegendDot key={e.name} color={e.color} text={`${e.name} (${e.value})`} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow border">
          <h3 className="font-semibold mb-3">Người dùng theo năm học</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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

function LegendDot({ color, text }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span>{text}</span>
    </div>
  );
}
