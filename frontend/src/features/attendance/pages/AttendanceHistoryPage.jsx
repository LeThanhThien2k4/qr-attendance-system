import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/axios";
import { toast } from "react-hot-toast";

export default function AttendanceHistoryPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["attendance.history"],
    queryFn: async () => (await api.get("/attendance/history")).data,
  });

  if (isLoading) return <p>Đang tải dữ liệu...</p>;
  if (isError) {
    toast.error("Không thể tải lịch sử điểm danh");
    return <p className="text-red-600">Lỗi tải dữ liệu.</p>;
  }

  const records = data || [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📋 Lịch sử điểm danh</h1>
      {records.length === 0 ? (
        <p className="text-gray-600">Chưa có bản ghi điểm danh nào.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Môn học</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Vị trí</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(r.date).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.courseName}</td>
                  <td className="px-4 py-3">{r.className}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        r.status === "PRESENT"
                          ? "bg-green-500"
                          : r.status === "LATE"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.location ? `${r.location.lat}, ${r.location.lng}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
