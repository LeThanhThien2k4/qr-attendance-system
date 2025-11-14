// frontend/src/components/ExcelImportButton.jsx
import React, { useRef, useState } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";

export default function ExcelImportButton({
  endpoint,
  onSuccess,
  label = "Import Excel",
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (loading) return;
    inputRef.current?.click();
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data?.message || "Import thành công");
      onSuccess?.(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi import Excel");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
      >
        {loading ? "Đang import..." : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
}
