import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

/* ========== TẠO TÀI KHOẢN MỚI ========== */
export const createUser = async (req, res) => {
    try {
          console.log("BODY:", req.body);
    console.log("USER:", req.user);
    const { code, name, email, password, role, phone } = req.body;

    if (!code || !name || !email || !password || !role)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });

    // Kiểm tra trùng mã hoặc email
    const exists = await User.findOne({ $or: [{ code }, { email }] });
    if (exists)
      return res
        .status(400)
        .json({ message: "Mã hoặc email đã tồn tại" });

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = await User.create({
      code,
      name,
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      phone,
    });

    res.json({ message: "Tạo tài khoản thành công", user: newUser });
  } catch (err) {
        console.error("❌ CREATE USER ERROR:", err);
        
    res.status(500).json({ message: err.message });
  }
};

/* ========== LẤY DANH SÁCH USERS ========== */
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select("-password") // ẩn password khi trả về
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ========== XOÁ TÀI KHOẢN ========== */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "Đã xoá người dùng" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ========== CẬP NHẬT NGƯỜI DÙNG ========== */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, email, password, role, phone, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Cập nhật các trường cho phép
    if (code) user.code = code;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role.toLowerCase(); // chuyển về enum chuẩn
    if (typeof isActive !== "undefined") user.isActive = isActive;

    // Nếu có thay đổi mật khẩu
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: "Cập nhật thành công", user });
  } catch (err) {
    console.error("❌ UPDATE USER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


// === IMPORT USER (Sinh viên hoặc Giảng viên) ===
export const importUsers = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) return res.status(400).json({ message: "Thiếu role (student hoặc lecturer)" });

    if (!req.file) return res.status(400).json({ message: "Chưa chọn file để import" });

    const workbook = XLSX.read(fs.readFileSync(req.file.path), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "File Excel không có dữ liệu" });
    }

    let added = 0, updated = 0, skipped = 0;

    for (const row of data) {
      const code = String(row["Mã"] || "").trim();
      const name = String(row["Họ tên"] || "").trim();
      const email = String(row["Email"] || "").trim().toLowerCase();
      const password = String(row["Mật khẩu"] || "123456").trim();

      if (!code || !name || !email) {
        skipped++;
        continue;
      }

      let existing = await User.findOne({ code });

      if (!existing) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          skipped++;
          continue;
        }
      }

      if (existing) {
        await User.updateOne(
          { code },
          {
            $set: {
              name,
              email,
              password,
              role,
              isActive: true,
            },
          }
        );
        updated++;
      } else {
        await User.create({
          code,
          name,
          email,
          password,
          role,
          isActive: true,
        });
        added++;
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: "Import hoàn tất",
      summary: { added, updated, skipped },
    });

  } catch (err) {
    console.error("❌ IMPORT USERS ERROR:", err);
    res.status(500).json({
      message: "Lỗi khi import file Excel",
      error: err.message,
    });
  }
};
// === EXPORT USER (Sinh viên hoặc Giảng viên) ===
export const exportUsers = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) return res.status(400).json({ message: "Thiếu role (student hoặc lecturer)" });

    const users = await User.find({ role }).select("code name email createdAt");
    if (!users.length) return res.status(404).json({ message: "Không có dữ liệu để export" });

    // Dữ liệu ghi ra Excel
    const data = users.map(u => ({
      "Mã": u.code,
      "Họ tên": u.name,
      "Email": u.email,
      "Ngày tạo": new Date(u.createdAt).toLocaleDateString("vi-VN"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách");

    // Đảm bảo thư mục exports tồn tại
    const exportDir = path.join(process.cwd(), "backend", "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, `${role}_list_${Date.now()}.xlsx`);
    XLSX.writeFile(wb, filePath);

    // Trả file về FE
    res.download(filePath, err => {
      if (err) {
        console.error("❌ EXPORT USERS DOWNLOAD ERROR:", err);
        res.status(500).json({ message: "Lỗi khi tải file Excel" });
      } else {
        // Xóa file sau 5 giây để dọn dẹp
        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 5000);
      }
    });
  } catch (err) {
    console.error("❌ EXPORT USERS ERROR:", err);
    res.status(500).json({ message: "Lỗi khi export dữ liệu", error: err.message });
  }
};
