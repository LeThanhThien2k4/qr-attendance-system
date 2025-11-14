// src/features/auth/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState } from "react";
import jwt_decode from "jwt-decode";

const AuthContext = createContext(null);

const ROLES = ["admin", "lecturer", "student"];
const tokenKey = (role) => `token_${role}`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------
     🔄 RESTORE TOKEN CHUẨN CHO ĐA-TAB - ĐA-ROLE
  ---------------------------------------------------- */
  useEffect(() => {
    const currentRole = sessionStorage.getItem("current_role");
    if (!currentRole) {
      setLoading(false);
      return;
    }

    const savedToken = localStorage.getItem(tokenKey(currentRole));
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwt_decode(savedToken);
      const now = Date.now() / 1000;

      if (decoded.exp && decoded.exp < now) {
        localStorage.removeItem(tokenKey(currentRole));
      } else {
        setUser(decoded);
        setToken(savedToken);
      }
    } catch {
      localStorage.removeItem(tokenKey(currentRole));
    }

    setLoading(false);
  }, []);

  /* ----------------------------------------------------
     🔐 LOGIN — MỖI TAB GIỮ ROLE RIÊNG
  ---------------------------------------------------- */
  const login = (jwt) => {
    const decoded = jwt_decode(jwt);
    const role = decoded.role?.toLowerCase();

    if (!role) throw new Error("Token không có role");

    // Ghi role cho TAB này
    sessionStorage.setItem("current_role", role);

    // KHÔNG XÓA token role khác
    localStorage.setItem(tokenKey(role), jwt);

    setUser(decoded);
    setToken(jwt);
  };

  /* ----------------------------------------------------
     🚪 LOGOUT — CHỈ XÓA TOKEN ROLE CỦA TAB HIỆN TẠI
  ---------------------------------------------------- */
  const logout = () => {
    const role = sessionStorage.getItem("current_role");

    if (role) {
      localStorage.removeItem(tokenKey(role));
      sessionStorage.removeItem("current_role");
    }

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
