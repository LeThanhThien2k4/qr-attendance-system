import React, { useState } from "react";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

export default function AdminUserImportPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      toast.error("Chỉ hỗ trợ file Excel (.xlsx hoặc .xls)");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Chưa chọn file");
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/users/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(data.message || "Import thành công");
      setResult(data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Lỗi import file");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Import danh sách người dùng</h2>

        {/* Upload box */}
        <label
          htmlFor="file"
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 block"
        >
          {file ? (
            <div>
              <p className="text-sm text-gray-600">Đã chọn:</p>
              <p className="font-medium text-blue-600">{file.name}</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 font-medium mb-1">
                Kéo thả hoặc bấm để chọn file Excel (.xlsx)
              </p>
              <p className="text-gray-500 text-sm">
                Cột bắt buộc: <b>fullName, email, role</b>
              </p>
            </div>
          )}
        </label>
        <input
          type="file"
          id="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 rounded border"
          >
            Làm mới
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`px-4 py-2 rounded text-white ${
              loading || !file
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Đang tải lên..." : "Bắt đầu import"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white border rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-3">
            Kết quả import ({result.imported} dòng)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Email</Th>
                  <Th>Vai trò</Th>
                  <Th>Mã</Th>
                  <Th>Trạng thái</Th>
                </tr>
              </thead>
              <tbody>
                {result.results?.map((r, i) => (
                  <tr key={i} className="border-t">
                    <Td>{r.email}</Td>
                    <Td>{r.role}</Td>
                    <Td>{r.code || "-"}</Td>
                    <Td>
                      {r.status === "created" ? (
                        <span className="text-green-600 font-medium">
                          Đã tạo
                        </span>
                      ) : (
                        <span className="text-gray-600">{r.status}</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left font-semibold px-4 py-2">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-2">{children}</td>;
}
