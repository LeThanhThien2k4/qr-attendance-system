// middlewares/role.js
export default function requireRole(role) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized" });

    // So sánh không phân biệt hoa thường
    if (req.user.role?.toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }

    next();
  };
}
