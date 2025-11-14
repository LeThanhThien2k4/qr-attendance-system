import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

export default function StudentScanPage() {
  const scannerRef = useRef(null);
  const [gps, setGps] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => toast.error("Không thể lấy GPS – Hãy bật định vị!"),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!gps) return;

    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scannerRef.current.render(onScanSuccess);

    return () => {
      scannerRef.current.clear?.();
    };
  }, [gps]);

  const onScanSuccess = async (decodedText) => {
    try {
      const data = JSON.parse(decodedText);

      const res = await api.post("/student/check-in", {
        attendanceId: data.attendanceId,
        gps,
      });

      toast.success("Điểm danh thành công");
    } catch (err) {
      toast.error(err.response?.data?.message || "Điểm danh thất bại");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Quét mã QR điểm danh</h1>

      {!gps ? (
        <p className="text-red-500">Đang lấy GPS...</p>
      ) : (
        <div id="reader" className="rounded-xl overflow-hidden"></div>
      )}
    </div>
  );
}
