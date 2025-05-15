'use client';

import { useState } from "react";
import { Tooltip } from "antd";
import { Trash, Edit, ReceiptText } from "lucide-react";
import { toast } from "sonner";

interface Role {
  id: number;
  name: string;
}

interface RoleTableProps {
  roles: Role[];
  onDeleteRole: (id: number) => void;
  onManagePermissions: (roleId: number, roleName: string) => void;
  onUpdateRole: (roleId: number, updatedData: { name: string }) => Promise<boolean>;
}

export default function RoleTable({ roles, onDeleteRole, onManagePermissions, onUpdateRole }: RoleTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditClick = (role: Role) => {
    setEditingId(role.id);
    setEditName(role.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (roleId: number) => {
    if (!editName.trim()) {
      toast.error("Tên vai trò không được để trống");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onUpdateRole(roleId, { name: editName });
      if (success) {
        toast.success("Cập nhật vai trò thành công");
        setEditingId(null);
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật vai trò");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              STT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tên Vai trò
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {roles.map((role, index) => (
            <tr key={role.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === role.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md"
                    disabled={isSubmitting}
                    autoFocus
                  />
                ) : (
                  role.name
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div className="flex justify-center space-x-2">
                  {editingId === role.id ? (
                    <>
                      <Tooltip title="Lưu thay đổi" placement="top">
                        <button
                          onClick={() => handleSaveEdit(role.id)}
                          className="text-green-600 hover:text-green-900"
                          disabled={isSubmitting}
                        >
                          Lưu
                        </button>
                      </Tooltip>
                      <Tooltip title="Hủy" placement="top">
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={isSubmitting}
                        >
                          Hủy
                        </button>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip title="Quản lý quyền của vai trò" placement="top">
                        <button
                          onClick={() => onManagePermissions(role.id, role.name)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <ReceiptText size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa vai trò" placement="top">
                        <button
                          onClick={() => handleEditClick(role)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={20} />
                        </button>
                      </Tooltip>

                      <Tooltip title="Xóa vai trò" placement="top">
                        <button
                          onClick={() => onDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash size={20} />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 