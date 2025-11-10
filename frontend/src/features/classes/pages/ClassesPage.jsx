import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/axios";
import { toast } from "react-hot-toast";

export default function ClassesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["classes.list"],
    queryFn: async () => (await api.get("/classes")).data,
  });

  if (isLoading) return <p>Đang tải danh sách lớp...</p>;
  if (isError) {
    toast.error("Không thể tải danh sách lớp");
    return <p className="text-red-600">Lỗi tải dữ liệu.</p>;
  }

  const classes = data || [];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🏫 Danh sách lớp học</h1>

      {classes.length === 0 ? (
        <p className="text-gray-600">Chưa có lớp nào được phân công.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="border rounded-xl bg-white shadow-sm hover:shadow-md transition p-4"
            >
              <h2 className="text-lg font-semibold text-blue-700">{cls.name}</h2>
              <p className="text-gray-600 text-sm mt-1">
                Môn: {cls.courseName}
              </p>
              <p className="text-gray-600 text-sm">
                Giảng viên: {cls.lecturerName || "Chưa phân công"}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Sĩ số: {cls.studentCount} sinh viên
              </p>
              <button
                onClick={() => toast.success("Chức năng xem chi tiết đang phát triển")}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Xem chi tiết →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
