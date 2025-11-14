// frontend/src/components/ExcelExportButton.jsx
import React, { useState } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";

export default function ExcelExportButton({
  endpoint,
  filename = "export.xlsx",
  label = "Export Excel",
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await api.get(endpoint, { responseType: "blob" });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi export Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
    >
      {loading ? "Đang export..." : label}
    </button>
  );
}
