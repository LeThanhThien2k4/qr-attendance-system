import React from "react";

export default function AuthLayout({ children }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
