import React, { useEffect, useState } from "react";
import api from "../../../../lib/axios";

export default function StudentDashboardPage() {
  const [records, setRecords] = useState([]);

  const load = async () => {
    const res = await api.get("/attendance/my");
    setRecords(res.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Lịch sử điểm danh</h1>

      <table className="w-full text-sm bg-white shadow rounded-xl">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Lớp</th>
            <th className="p-2 text-left">Ngày</th>
            <th className="p-2 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r._id} className="border-b">
              <td className="p-2">{r.className}</td>
              <td className="p-2">
                {new Date(r.date).toLocaleString("vi-VN")}
              </td>
              <td className="p-2">
                {r.status === "PRESENT" ? (
                  <span className="text-green-600 font-semibold">Có mặt</span>
                ) : (
                  <span className="text-red-600 font-semibold">Vắng</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
