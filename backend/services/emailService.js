import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// === Cấu hình transporter Gmail ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Gửi email chung cho hệ thống
 * @param {Object} param0
 * @param {string} param0.to - email người nhận
 * @param {string} param0.subject - tiêu đề
 * @param {string} param0.html - nội dung HTML
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Hệ thống điểm danh QR" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send error:", err.message);
  }
};

/**
 * Gửi email tạo tài khoản mới (dành cho Admin Import)
 */
export const sendAccountEmail = async ({ to, fullName, email, password }) => {
  const html = `
    <h3>Xin chào ${fullName},</h3>
    <p>Tài khoản điểm danh của bạn đã được tạo thành công.</p>
    <ul>
      <li><b>Email:</b> ${email}</li>
      <li><b>Mật khẩu:</b> ${password}</li>
    </ul>
    <p>Đăng nhập tại: <a href="http://localhost:5173/login">Hệ thống điểm danh QR</a></p>
    <br/>
    <small>Trân trọng,<br/>Phòng CNTT - Hệ thống điểm danh QR</small>
  `;
  await sendEmail({
    to,
    subject: "🎓 Tài khoản điểm danh QR của bạn",
    html,
  });
};
