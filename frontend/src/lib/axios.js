// src/lib/axios.js
import axios from "axios";

console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);

const getActiveToken = () => {
  const role = sessionStorage.getItem("current_role");
  if (!role) return null;
  return localStorage.getItem(`token_${role}`);
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api", // <-- bắt buộc dùng env
});

api.interceptors.request.use((config) => {
  const token = getActiveToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const role = sessionStorage.getItem("current_role");
      if (role) {
        localStorage.removeItem(`token_${role}`);
        sessionStorage.removeItem("current_role");
      }
    }
    return Promise.reject(err);
  }
);

export default api;
