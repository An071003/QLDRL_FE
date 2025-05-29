"use client";

import { User } from "@/types/user";
import { Tooltip } from "antd";
import { format } from "date-fns";
import { Trash } from "lucide-react";
import { memo, useMemo } from "react";

interface UserTableProps {
  users: User[];
  onDeleteUser: (id: number) => void;
}

const UserTable = memo(function UserTable({ users, onDeleteUser }: UserTableProps) {
  const roleColors: Record<string, string> = useMemo(() => ({
    admin: 'bg-purple-100 text-purple-800',
    advisor: 'bg-green-100 text-green-800',
    departmentofficer: 'bg-orange-100 text-orange-800',
    student: 'bg-blue-100 text-blue-800',
    classleader: 'bg-red-100 text-red-800',
  }), []);
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              STT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tên
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vai trò
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ngày tạo
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user, index) => {
            const roleClass = (roleColors as Record<string, string>)[(user.Role?.name?.toString() ?? 'student')];
            return (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.user_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleClass}`}
                  >
                    {user.Role?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{format(new Date(user.created_at), 'dd/MM/yyyy')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Tooltip title="Xóa người dùng" placement="top">
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 ml-2"
                    >
                      <Trash size={20} />
                    </button>
                  </Tooltip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default UserTable;
