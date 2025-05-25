import { Modal } from "antd";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>{title}</span>
        </div>
      }
      open={isOpen}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Xác nhận"
      cancelText="Hủy"
      okButtonProps={{
        className: "bg-red-600 hover:bg-red-700",
      }}
    >
      <div className="py-4">
        <p className="text-gray-600">{message}</p>
      </div>
    </Modal>
  );
} 