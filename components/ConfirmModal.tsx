import React, { useEffect, useState } from "react";
import react from "react";
import { HelpCircle } from "lucide-react";

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
    }
  }, [message]);

  if (!message || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-lg bg-white p-6 text-center shadow-xl w-full max-w-sm">
        <HelpCircle className="mx-auto mb-4 h-10 w-10 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-around">
          <button
            onClick={onConfirm}
            className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};
