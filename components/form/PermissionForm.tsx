'use client';

import { useState } from "react";
import { toast } from "sonner";

interface PermissionFormProps {
  onPermissionCreated: (newPermission: { name: string; action: string }) => Promise<{ success: boolean; message: any }>;
  setLoading: (value: boolean) => void;
}

export default function PermissionForm({ onPermissionCreated, setLoading }: PermissionFormProps) {
  const [newPermission, setNewPermission] = useState<{
    name: string;
    action: string;
  }>({
    name: '',
    action: '',
  });

  const availableActions = [
    { value: 'create', label: 'Create' },
    { value: 'view', label: 'View' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPermission(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onPermissionCreated(newPermission);
      if (result.success) {
        setNewPermission({ name: '', action: '' });
        toast.success("Tạo quyền hạn thành công");
      } else {
        toast.error(result.message || "Lỗi tạo quyền hạn");
      }
    } catch (error) {
      toast.error("Lỗi tạo quyền hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-medium mb-4">Tạo quyền hạn mới</h2>
      <form onSubmit={handleCreatePermission} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chức năng</label>
            <input
              type="text"
              name="name"
              value={newPermission.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quyền</label>
            <select
              name="action"
              value={newPermission.action}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="" disabled>-- Chọn quyền --</option>
              {availableActions.map(action => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="px-4 py-2 text-white rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
          >
            Tạo Quyền hạn
          </button>
        </div>
      </form>
    </div>
  );
} 