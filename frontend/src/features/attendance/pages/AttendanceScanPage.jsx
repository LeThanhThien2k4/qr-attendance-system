import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/axios";
import QrScanner from "../components/QrScanner";
import useGeo from "../hooks/useGeo";
import { toast } from "react-hot-toast";

export default function AttendanceScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const { loading, coords, error } = useGeo(isScanning);

  const mutation = useMutation({
    mutationFn: (payload) => api.post("/attendance/checkin", payload).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`Điểm danh thành công (${Math.round(data.distance)}m)`);
      setIsScanning(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Lỗi điểm danh");
      setIsScanning(false);
    },
  });

  const handleScan = (qr) => {
    if (!coords) return toast.error("Chưa lấy được vị trí GPS");
    mutation.mutate({ qr, coords });
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Điểm danh bằng QR Code</h1>

      {/* Trạng thái GPS */}
      {loading && <p className="text-gray-600">📍 Đang lấy vị trí hiện tại...</p>}
      {error && <p className="text-red-600">❌ Lỗi GPS: {error}</p>}
      {coords && (
        <p className="text-sm text-green-700">
          Vị trí: ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
        </p>
      )}

      {/* Quét QR */}
      {isScanning ? (
        <div className="mt-4">
          <QrScanner onScan={handleScan} onError={() => toast.error("Không đọc được mã QR")} />
          <button
            onClick={() => setIsScanning(false)}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Dừng quét
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsScanning(true)}
          className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
        >
          Bắt đầu quét QR
        </button>
      )}
    </div>
  );
}
