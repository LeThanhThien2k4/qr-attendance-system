import { useEffect, useState, createContext, useContext } from "react";
import {jwtDecode} from "jwt-decode";
import { clearAll, getToken, setToken } from "../../../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getToken();
    if (saved) {
      try {
        const decoded = jwtDecode(saved);
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp < now) {
          clearAll();
        } else {
          setUser(decoded);
          setTokenState(saved);
        }
      } catch {
        clearAll();
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken) => {
    try {
      const decoded = jwtDecode(newToken);
      setUser(decoded);
      setTokenState(newToken);
      setToken(newToken);
    } catch {
      console.error("Invalid token on login");
    }
  };

  const logout = () => {
    clearAll();
    setUser(null);
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
