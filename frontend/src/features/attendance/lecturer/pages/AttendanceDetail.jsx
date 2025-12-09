import React, { useState, useEffect } from "react";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

export default function AttendanceDetail({ attendanceId, detail, reload }) {
  const [present, setPresent] = useState([]);
  const [absent, setAbsent] = useState([]);

  useEffect(() => {
    if (detail) {
      setPresent(detail.present || []);
      setAbsent(detail.absent || []);
    }
  }, [detail]);

  const toggle = (student, toPresent) => {
    if (toPresent) {
      setPresent([...present, student]);
      setAbsent(absent.filter((s) => s._id !== student._id));
    } else {
      setAbsent([...absent, student]);
      setPresent(present.filter((s) => s._id !== student._id));
    }
  };

  const save = async () => {
    try {
      await api.patch(`/lecturer/attendance/${attendanceId}/manual-update`, {
        presentIds: present.map((s) => s._id),
      });

      toast.success("Đã cập nhật điểm danh!");
      reload();
    } catch (err) {
      toast.error("Không thể lưu thay đổi");
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm">
      <h3 className="font-semibold text-lg mb-3">Chi tiết buổi điểm danh</h3>

      <div className="grid grid-cols-2 gap-6">
        
        {/* CÓ MẶT */}
        <div>
          <h4 className="text-green-700 font-semibold mb-2">Có mặt</h4>

          {present.length === 0 && (
            <p className="text-gray-500 text-sm">Không có sinh viên nào</p>
          )}

            {present.map((s) => (
            <label key={s._id} className="flex items-center gap-2 mb-1">
                <input
                type="checkbox"
                checked
                onChange={() => toggle(s, false)}
                />
                {s.name}
            </label>
            ))}

        </div>

        {/* VẮNG */}
        <div>
          <h4 className="text-red-700 font-semibold mb-2">Vắng mặt</h4>

          {absent.length === 0 && (
            <p className="text-gray-500 text-sm">Không có sinh viên nào</p>
          )}

            {absent.map((s) => (
            <label key={s._id} className="flex items-center gap-2 mb-1">
                <input
                type="checkbox"
                checked={false}
                onChange={() => toggle(s, true)}
                />
                {s.name}
            </label>
            ))}

        </div>

      </div>

      <button
        onClick={save}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Lưu thay đổi
      </button>
    </div>
  );
}
