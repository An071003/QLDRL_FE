import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptText, SquarePen, Trash } from 'lucide-react';
import { Tooltip } from 'antd';
import { toast } from 'sonner';

interface DepartmentOfficer {
  id: number;
  officer_name: string;
  officer_phone: string;
  User?: {
    email: string;
    user_name: string;
  };
}

interface DepartmentOfficerTableProps {
  officers: DepartmentOfficer[];
  editingOfficerId: number | null;
  editData: {
    officer_name: string;
    officer_phone: string;
  };
  onDeleteOfficer: (id: number) => void;
  onEditClick: (officer: DepartmentOfficer) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onEditDataChange: (data: any) => void;
}

export default function DepartmentOfficerTable({
  officers,
  editingOfficerId,
  editData,
  onDeleteOfficer,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onEditDataChange
}: DepartmentOfficerTableProps) {
  const router = useRouter();

  const handleViewDetail = (officerId: number) => {
    router.push(`/uit/admin/department-officers/${officerId}`);
  };

  const validatePhoneInput = (value: string): boolean => {
    return value === '' || /^\d{0,10}$/.test(value);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = (id: number) => {
    if (editData.officer_phone && !validatePhone(editData.officer_phone)) {
      toast.error('Số điện thoại phải có 10 chữ số');
      return;
    }
    
    onSaveEdit(id);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên cán bộ</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {officers.length > 0 ? (
            officers.map((officer, index) => (
              <tr key={officer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingOfficerId === officer.id ? (
                    <input
                      type="text"
                      value={editData.officer_name}
                      onChange={(e) => onEditDataChange({ ...editData, officer_name: e.target.value })}
                      className="w-full px-2 py-1 border rounded-md"
                    />
                  ) : (
                    officer.officer_name || ''
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {officer.User?.user_name || ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {officer.User?.email || ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingOfficerId === officer.id ? (
                    <input
                      type="text"
                      value={editData.officer_phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (validatePhoneInput(value)) {
                          onEditDataChange({ ...editData, officer_phone: value });
                        }
                      }}
                      className="w-full px-2 py-1 border rounded-md"
                      placeholder="Nhập số điện thoại"
                      maxLength={10}
                    />
                  ) : (
                    officer.officer_phone || ''
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {editingOfficerId === officer.id ? (
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => handleSave(officer.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={onCancelEdit}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center space-x-3">
                      <Tooltip title="Xem chi tiết" placement="top">
                        <button
                          onClick={() => handleViewDetail(officer.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <ReceiptText size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa cán bộ" placement="top">
                        <button
                          onClick={() => onEditClick(officer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <SquarePen size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Xóa cán bộ" placement="top">
                        <button
                          onClick={() => onDeleteOfficer(officer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash size={20} />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                Không có cán bộ khoa nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 