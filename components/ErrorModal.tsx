"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorModalProps {
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
    }
  }, [message]);

  if (!message || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-lg bg-white p-6 text-center shadow-xl w-full max-w-sm">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => handleClose()}
          className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          OK
        </button>
      </div>
    </div>
  );
};
