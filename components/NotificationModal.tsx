import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface NotificationModalProps {
  message: string;
  onClose?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ message, onClose }) => {
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
        <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Thông báo</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => handleClose()}
          className="rounded-md cursor-pointer bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          OK
        </button>
      </div>
    </div>
  );
};
