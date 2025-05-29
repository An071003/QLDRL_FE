'use client';

import { useState } from "react";
import { toast } from "sonner";

interface RoleFormProps {
  onRoleCreated: (newRole: { name: string }) => Promise<{ success: boolean; message: string }>;
  setLoading: (value: boolean) => void;
}

export default function RoleForm({ onRoleCreated, setLoading }: RoleFormProps) {
  const [roleName, setRoleName] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoleName(e.target.value);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onRoleCreated({ name: roleName });
      if (result.success) {
        setRoleName('');
        toast.success("Tạo vai trò thành công");
      } else {
        toast.error(result.message || "Lỗi tạo vai trò");
      }
    } catch (error) {
      console.error(error)
      toast.error("Lỗi tạo vai trò");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-medium mb-4">Tạo vai trò mới</h2>
      <form onSubmit={handleCreateRole} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên vai trò</label>
          <input
            type="text"
            value={roleName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="px-4 py-2 text-white rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
          >
            Tạo Vai trò
          </button>
        </div>
      </form>
    </div>
  );
} 