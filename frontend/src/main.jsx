// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router.jsx";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./features/auth/hooks/useAuth.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
      <Toaster position="top-right" />
    </AuthProvider>
  </React.StrictMode>
);
