// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router.jsx";
import { AuthProvider } from "./features/auth/hooks/useAuth.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
