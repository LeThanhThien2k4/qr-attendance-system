import xlsx from "xlsx";

/**
 * Đọc file Excel và chuyển thành danh sách object.
 * Các cột yêu cầu: "Họ và tên", "Email", "Vai trò"
 */
export function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  return rows.map((r) => ({
    fullName: r["Họ và tên"],
    email: r["Email"],
    role: (r["Vai trò"] || "").toUpperCase(),
  }));
}
