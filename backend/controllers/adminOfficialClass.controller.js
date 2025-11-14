// backend/controllers/adminOfficialClass.controller.js
import OfficialClass from "../models/officialClass.model.js";
import User from "../models/user.model.js";
import XLSX from "xlsx";
import fs from "fs";

/* ==========================================================
   📘 Lấy danh sách tất cả lớp chính quy
   ========================================================== */
export const getOfficialClasses = async (req, res) => {
  try {
    const classes = await OfficialClass.find()
      .populate("advisor", "name email")
      .populate("students", "code name email")
      .sort({ courseYear: -1, code: 1 });

    res.json(classes);
  } catch (err) {
    console.error("❌ GET OfficialClasses ERROR:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách lớp chính quy" });
  }
};

/* ==========================================================
   🏫 Tạo lớp chính quy mới
   ========================================================== */
export const createOfficialClass = async (req, res) => {
  try {
    const { code, major, courseYear, advisor } = req.body;

    if (!code || !major || !courseYear) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const exists = await OfficialClass.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: "Mã lớp đã tồn tại" });
    }

    const newClass = await OfficialClass.create({
      code,
      major,
      courseYear,
      advisor: advisor || null,
    });

    res.status(201).json({
      message: "Tạo lớp chính quy thành công",
      data: newClass,
    });
  } catch (err) {
    console.error("❌ CREATE OfficialClass ERROR:", err);
    res.status(500).json({ message: "Lỗi khi tạo lớp chính quy" });
  }
};

/* ==========================================================
   ✏️ Cập nhật thông tin lớp chính quy
   ========================================================== */
export const updateOfficialClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, major, courseYear, advisor } = req.body;

    if (code) {
      const existing = await OfficialClass.findOne({
        code,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({ message: "Mã lớp đã tồn tại" });
      }
    }

    const updated = await OfficialClass.findByIdAndUpdate(
      id,
      { code, major, courseYear, advisor },
      { new: true }
    )
      .populate("advisor", "name email")
      .populate("students", "code name email");

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lớp chính quy" });
    }

    res.json({
      message: "Cập nhật lớp chính quy thành công",
      data: updated,
    });
  } catch (err) {
    console.error("❌ UPDATE OfficialClass ERROR:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật lớp chính quy" });
  }
};

/* ==========================================================
   🗑️ Xóa lớp chính quy
   ========================================================== */
export const deleteOfficialClass = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OfficialClass.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lớp chính quy" });
    }

    // Gỡ officialClass khỏi tất cả sinh viên thuộc lớp này
    await User.updateMany(
      { officialClass: id },
      { $unset: { officialClass: "" } }
    );

    res.json({ message: "Đã xóa lớp chính quy" });
  } catch (err) {
    console.error("❌ DELETE OfficialClass ERROR:", err);
    res.status(500).json({ message: "Lỗi khi xóa lớp chính quy" });
  }
};

/* ==========================================================
   👨‍🎓 Thêm sinh viên vào lớp (thủ công)
   ========================================================== */
export const addStudentToClass = async (req, res) => {
  try {
    const { id } = req.params; // officialClass id
    const { studentId } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sinh viên hợp lệ" });
    }

    const officialClass = await OfficialClass.findById(id);
    if (!officialClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp chính quy" });
    }

    // Nếu trước đó SV thuộc lớp khác → cập nhật lại officialClass
    if (
      student.officialClass &&
      student.officialClass.toString() !== officialClass._id.toString()
    ) {
      // Gỡ khỏi lớp cũ
      await OfficialClass.updateOne(
        { _id: student.officialClass },
        { $pull: { students: student._id } }
      );
    }

    // Thêm vào lớp mới nếu chưa có
    if (!officialClass.students.includes(student._id)) {
      officialClass.students.push(student._id);
      await officialClass.save();
    }

    student.officialClass = officialClass._id;
    await student.save();

    const populated = await OfficialClass.findById(id)
      .populate("advisor", "name email")
      .populate("students", "code name email");

    res.json({ message: "Đã thêm sinh viên vào lớp", data: populated });
  } catch (err) {
    console.error("❌ ADD STUDENT ERROR:", err);
    res.status(500).json({ message: "Lỗi khi thêm sinh viên vào lớp" });
  }
};

/* ==========================================================
   🚫 Xóa sinh viên khỏi lớp
   ========================================================== */
export const removeStudentFromClass = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const officialClass = await OfficialClass.findById(id);
    if (!officialClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp chính quy" });
    }

    officialClass.students = officialClass.students.filter(
      (s) => s.toString() !== studentId
    );
    await officialClass.save();

    // Xóa liên kết trong user nếu đang trỏ lớp này
    const student = await User.findById(studentId);
    if (student && student.officialClass?.toString() === id) {
      student.officialClass = null;
      await student.save();
    }

    const populated = await OfficialClass.findById(id)
      .populate("advisor", "name email")
      .populate("students", "code name email");

    res.json({ message: "Đã xóa sinh viên khỏi lớp", data: populated });
  } catch (err) {
    console.error("❌ REMOVE STUDENT ERROR:", err);
    res.status(500).json({ message: "Lỗi khi xóa sinh viên khỏi lớp" });
  }
};

/* ==========================================================
   ⬆️ IMPORT SINH VIÊN VÀO LỚP TỪ EXCEL
   File mẫu: cột "Mã SV", "Họ tên", "Email"
   ========================================================== */
export const importClassStudents = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Chưa chọn file Excel" });
    }

    const officialClass = await OfficialClass.findById(id);
    if (!officialClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp" });
    }

    const workbook = XLSX.read(fs.readFileSync(req.file.path), {
      type: "buffer",
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let created = 0;
    let linked = 0;
    let skipped = 0;
    const errors = [];

    for (const [idx, row] of rows.entries()) {
      const code = String(row["Mã SV"] || "").trim();
      const name = String(row["Họ tên"] || "").trim();
      const emailRaw = String(row["Email"] || "").trim();
      const email = emailRaw.toLowerCase();

      if (!code || !name || !email) {
        skipped++;
        continue;
      }

      let student = await User.findOne({ code });

      if (!student) {
        // tránh trùng email
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          errors.push(
            `Dòng ${idx + 2}: Email ${email} đã tồn tại (bỏ qua tạo mới)`
          );
          skipped++;
          student = emailExists; // có thể link vào lớp nếu là student
        } else {
          student = await User.create({
            code,
            name,
            email,
            password: "123456",
            role: "student",
          });
          created++;
        }
      }

      // chỉ xử lý nếu đúng role sinh viên
      if (student.role !== "student") {
        errors.push(
          `Dòng ${idx + 2}: User ${code} / ${email} không phải sinh viên`
        );
        skipped++;
        continue;
      }

      // gỡ khỏi lớp cũ (nếu có)
      if (
        student.officialClass &&
        student.officialClass.toString() !== officialClass._id.toString()
      ) {
        await OfficialClass.updateOne(
          { _id: student.officialClass },
          { $pull: { students: student._id } }
        );
      }

      // thêm vào lớp này
      if (!officialClass.students.includes(student._id)) {
        officialClass.students.push(student._id);
        linked++;
      } else {
        skipped++;
      }

      student.officialClass = officialClass._id;
      await student.save();
    }

    await officialClass.save();
    fs.unlinkSync(req.file.path);

    const populated = await OfficialClass.findById(id)
      .populate("advisor", "name email")
      .populate("students", "code name email");

    res.json({
      message: "Import sinh viên hoàn tất",
      summary: { created, linked, skipped, errors },
      data: populated,
    });
  } catch (err) {
    console.error("❌ IMPORT CLASS STUDENTS ERROR:", err);
    res
      .status(500)
      .json({ message: "Lỗi khi import sinh viên", error: err.message });
  }
};

/* ==========================================================
   ⬇️ EXPORT DANH SÁCH SINH VIÊN TRONG LỚP RA EXCEL
   ========================================================== */
export const exportClassStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const officialClass = await OfficialClass.findById(id).populate(
      "students",
      "code name email"
    );

    if (!officialClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp" });
    }

    const data = (officialClass.students || []).map((s) => ({
      "Mã SV": s.code,
      "Họ tên": s.name,
      Email: s.email,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachSinhVien");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${officialClass.code}_SinhVien.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error("❌ EXPORT CLASS STUDENTS ERROR:", err);
    res
      .status(500)
      .json({ message: "Lỗi khi xuất danh sách sinh viên của lớp" });
  }
};

export const getOfficialClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await OfficialClass.findById(id)
      .populate("advisor", "name email")
      .populate("students", "code name email");

    if (!cls) return res.status(404).json({ message: "Không tìm thấy lớp" });

    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
