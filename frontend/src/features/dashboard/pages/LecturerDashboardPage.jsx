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

  /* ================= AI ================= */
  const [aiClassId, setAiClassId] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);

  /* ================= LOAD DASHBOARD ================= */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/lecturer/dashboard");
        if (!alive) return;
        setStats(data);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  const classSeries = useMemo(() => {
    if (!stats?.classStats) return [];
    return stats.classStats.map((c) => ({
      classId: c.classId,
      classCode: c.classCode || "N/A",
      attendanceRate: Number(c.attendanceRate ?? 0),
    }));
  }, [stats]);

  /* ================= AI HANDLER ================= */
  const handleAIAnalyze = async () => {
    if (!aiClassId) return;

    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      const { data } = await api.get("/ai/predict/class", {
        params: { classId: aiClassId },
      });
      setAiResult(data);
    } catch (e) {
      setAiError(e?.response?.data?.message || "Không thể phân tích AI");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-6">Đang tải thống kê...</div>;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!stats) return <div className="p-6">Không có dữ liệu</div>;

  const { summary, todaySessions, recentAttendances, lowAttendanceClasses } =
    stats;

  return (
    <div className="p-6 space-y-8">
      {/* ================= SUMMARY ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Lớp phụ trách" value={summary?.totalClasses ?? 0} />
        <StatCard label="Buổi điểm danh" value={summary?.totalSessions ?? 0} />
        <StatCard label="Tổng có mặt" value={summary?.totalPresent ?? 0} />
        <StatCard
          label="Chuyên cần TB"
          value={`${summary?.attendanceRate ?? 0}%`}
        />
      </div>

      {/* ================= CHART ================= */}
      <Section title="Tỉ lệ chuyên cần theo lớp (%)">
        {classSeries.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="classCode" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <RTooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="attendanceRate" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="Chưa có dữ liệu chuyên cần." />
        )}
      </Section>

      {/* ================= AI ANALYSIS (FIXED) ================= */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 shadow">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-semibold text-lg text-blue-900">
              🤖 AI Phân tích xu hướng vắng học
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Phân tích lịch sử điểm danh để dự đoán nguy cơ nghỉ học theo lớp và
              theo sinh viên.
            </p>
          </div>
          {aiResult?.source && (
            <span className="text-xs px-2 py-1 rounded-full border bg-white">
              {aiResult.source === "gemini"
                ? "Gemini AI"
                : "Rule-based"}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <select
            value={aiClassId}
            onChange={(e) => setAiClassId(e.target.value)}
            className="border rounded-xl px-3 py-2 min-w-[220px] bg-white"
          >
            <option value="">-- Chọn lớp để phân tích --</option>
            {classSeries.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.classCode}
              </option>
            ))}
          </select>

          <button
            onClick={handleAIAnalyze}
            disabled={!aiClassId || aiLoading}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {aiLoading ? "Đang phân tích..." : "Phân tích AI"}
          </button>

          {aiResult && (
            <button
              onClick={() => setAiResult(null)}
              className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50"
            >
              Xoá kết quả
            </button>
          )}
        </div>

        {aiError && (
          <p className="mt-3 text-sm text-red-600">Lỗi: {aiError}</p>
        )}

        {aiResult && (
          <div className="mt-4 bg-white rounded-2xl border p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Rủi ro lớp:</span>
              <RiskBadge risk={aiResult.classRisk} />
            </div>

            {aiResult.summary && (
              <p className="text-sm text-gray-700">{aiResult.summary}</p>
            )}

            <div>
              <div className="text-sm font-semibold mb-2">
                Sinh viên có nguy cơ
              </div>
              {aiResult.students?.length ? (
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-2 text-left">Sinh viên</th>
                      <th className="p-2 text-center">Nguy cơ</th>
                      <th className="p-2 text-center">Xác suất</th>
                      <th className="p-2 text-left">Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiResult.students.map((s) => (
                      <tr key={s.studentId} className="border-b">
                        <td className="p-2 font-medium">
                          {s.name || s.studentId}
                        </td>
                        <td className="p-2 text-center">
                          <RiskBadge risk={s.risk} />
                        </td>
                        <td className="p-2 text-center">
                          {Number(s.probability ?? 0)}%
                        </td>
                        <td className="p-2 text-gray-700">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty text="Không có sinh viên rủi ro." />
              )}
            </div>

            {aiResult.recommendations?.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-1">Đề xuất</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {aiResult.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= LOW ATTENDANCE ================= */}
      <Section title="Lớp có chuyên cần thấp (&lt; 60%)">
        {lowAttendanceClasses?.length ? (
          <ul className="list-disc pl-5 text-sm space-y-1">
            {lowAttendanceClasses.map((c) => (
              <li key={c.classId}>
                <b>
                  {c.classCode} – {c.className}
                </b>{" "}
                – {c.attendanceRate.toFixed(1)}%
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="Không có lớp nào dưới 60%." />
        )}
      </Section>

      {/* ================= RECENT ================= */}
      <Section title="Lịch sử điểm danh gần nhất">
        {recentAttendances?.length ? (
          <TableAttendances data={recentAttendances} />
        ) : (
          <Empty text="Chưa có lịch sử điểm danh." />
        )}
      </Section>
    </div>
  );
}

/* ================= UI PARTS ================= */

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow border p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-gray-500 text-sm">{text}</p>;
}

function TableAttendances({ data }) {
  return (
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
        {data.map((a) => (
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
  );
}

function RiskBadge({ risk }) {
  const r = String(risk || "LOW").toUpperCase();
  const cls =
    r === "HIGH"
      ? "bg-red-50 text-red-700 border-red-200"
      : r === "MEDIUM"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-green-50 text-green-700 border-green-200";

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${cls}`}>
      {r}
    </span>
  );
}
