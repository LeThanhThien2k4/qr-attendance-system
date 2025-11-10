// ===============================
// ✅ Local Storage Utilities
// ===============================

// ===== Token =====
export const getToken = () => localStorage.getItem("token") || null;
export const setToken = (token) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};
export const clearToken = () => localStorage.removeItem("token");

// ===== User =====
export const getUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
};

export const clearUser = () => localStorage.removeItem("user");

// ===== Role =====
export const getRole = () => localStorage.getItem("role") || null;
export const setRole = (role) => {
  if (role) localStorage.setItem("role", role);
  else localStorage.removeItem("role");
};
export const clearRole = () => localStorage.removeItem("role");

// ===== Clear All =====
export const clearAll = () => {
  // Xóa toàn bộ các key hệ thống
  ["token", "user", "role"].forEach((key) => localStorage.removeItem(key));
};
