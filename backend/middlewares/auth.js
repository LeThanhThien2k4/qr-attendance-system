import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/**
 * Middleware xác thực JWT
 * - Kiểm tra token trong header Authorization
 * - Giải mã JWT và gán thông tin user vào req.user
 * - Nếu lỗi: trả 401 (thiếu token) hoặc 403 (token sai/hết hạn)
 */
export default function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // gán thông tin user vào request
    next();
  } catch (err) {
    res.status(403).json({ message: "Token invalid or expired" });
  }
}
