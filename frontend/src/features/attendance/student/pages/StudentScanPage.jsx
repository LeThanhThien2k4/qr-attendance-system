// src/features/attendance/student/pages/StudentScanPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

export default function StudentScanPage() {
  const scannerRef = useRef(null);
  const [gps, setGps] = useState(null);

  /* -------------------------------------------------------
      🔥 LẤY GPS CHUẨN NHẤT CHO ANDROID/iOS
  --------------------------------------------------------*/
  const getBestGPS = () =>
    new Promise((resolve) => {
      let best = null;

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const data = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };

          console.log("GPS Update:", data);

          // Cập nhật "tọa độ tốt nhất"
          if (!best || data.accuracy < best.accuracy) {
            best = data;
          }

          // Nếu accuracy < 30m → đủ tốt → dừng luôn
          if (data.accuracy < 30) {
            navigator.geolocation.clearWatch(watchId);
            resolve(best);
          }
        },
        (err) => {
          console.error("GPS ERROR:", err);
          resolve(best);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      // Fallback sau 4 giây (nếu GPS kém)
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        resolve(best);
      }, 4000);
    });

  /* -------------------------------------------------------
      📌 LẤY GPS KHI MỞ TRANG
  --------------------------------------------------------*/
  useEffect(() => {
    (async () => {
      toast.loading("Đang lấy vị trí GPS...");

      const best = await getBestGPS();

      toast.dismiss();

      if (!best) {
        toast.error("Không thể lấy GPS — vui lòng bật định vị!");
        return;
      }

      toast.success(`GPS OK (±${best.accuracy}m)`);
      setGps(best);
    })();
  }, []);

  /* -------------------------------------------------------
      📌 Khởi tạo máy quét QR
  --------------------------------------------------------*/
  useEffect(() => {
    if (!gps) return;

    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scannerRef.current.render(onScanSuccess);

    return () => {
      scannerRef.current?.clear?.();
    };
  }, [gps]);

  /* -------------------------------------------------------
      📌 Xử lý quét thành công
  --------------------------------------------------------*/
  const onScanSuccess = async (decodedText) => {
    try {
      const data = JSON.parse(decodedText);

      const res = await api.post("/student/check-in", {
        attendanceId: data.attendanceId,
        gps,
      });

      toast.success("Điểm danh thành công!");
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
