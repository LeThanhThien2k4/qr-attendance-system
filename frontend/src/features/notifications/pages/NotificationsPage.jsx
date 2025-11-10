import React, { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data);
      } catch (err) {
        console.error("❌ Lỗi tải thông báo:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <p>Đang tải thông báo...</p>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <Bell className="text-blue-600" />
        Thông báo
      </h1>

      {notifications.length === 0 ? (
        <p className="text-gray-500">Không có thông báo nào.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={`p-4 rounded-lg shadow-sm border-l-4 ${
                n.type === "ALERT"
                  ? "border-red-500 bg-red-50"
                  : n.type === "INFO"
                  ? "border-blue-500 bg-blue-50"
                  : "border-yellow-500 bg-yellow-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">{n.title}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700 mt-1">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
