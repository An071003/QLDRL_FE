'use client';

import { Tooltip } from "antd";
import { Trash, Edit } from "lucide-react";

interface Role {
  id: number;
  name: string;
}

interface RoleTableProps {
  roles: Role[];
  onDeleteRole: (id: number) => void;
  onManagePermissions: (roleId: number, roleName: string) => void;
}

export default function RoleTable({ roles, onDeleteRole, onManagePermissions }: RoleTableProps) {
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
              <td className="px-6 py-4 whitespace-nowrap">{role.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div className="flex justify-center space-x-2">
                  <Tooltip title="Quản lý quyền" placement="top">
                    <button
                      onClick={() => onManagePermissions(role.id, role.name)}
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 