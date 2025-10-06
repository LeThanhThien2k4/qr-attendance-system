import jwt from "jsonwebtoken";
import User from "../models/User.js"; // nếu bạn có model User; hoặc Teacher

export const protect = (roles = []) => {
  // roles: [] => allow any authenticated; or ["teacher"] etc.
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer "))
        return res.status(401).json({ message: "No token provided" });

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // decoded contains { id, role } from login
      req.user = decoded; // { id, role }

      // optional: load user from DB
      // const user = await User.findById(decoded.id).select("-password");
      // req.user = user;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden: insufficient rights" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token", error: err.message });
    }
  };
};
