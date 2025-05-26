import { useRouter } from 'next/navigation';
import { Advisor } from '@/types/advisor';
import { ReceiptText, SquarePen, Trash } from 'lucide-react';
import { Tooltip } from 'antd';
import { toast } from 'sonner';

interface Faculty {
  id: number;
  name: string;
  faculty_name?: string;
}

interface EditData {
  name: string;
  faculty_id: string;
  phone: string;
}

interface AdvisorTableProps {
  advisors: Advisor[];
  faculties: Faculty[];
  editingAdvisorId: number | null;
  editData: EditData;
  onDeleteAdvisor: (id: number) => void;
  onEditClick: (advisor: Advisor) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onEditDataChange: (data: EditData) => void;
}

export default function AdvisorTable({
  advisors,
  faculties,
  editingAdvisorId,
  editData,
  onDeleteAdvisor,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onEditDataChange
}: AdvisorTableProps) {
  const router = useRouter();

  const handleViewDetail = (advisorId: number) => {
    router.push(`/uit/admin/advisors/${advisorId}`);
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
    if (editData.phone && !validatePhone(editData.phone)) {
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên cố vấn</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {advisors.length > 0 ? (
            advisors.map((advisor, index) => (
              <tr key={advisor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAdvisorId === advisor.id ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => onEditDataChange({ ...editData, name: e.target.value })}
                      className="w-full px-2 py-1 border rounded-md"
                    />
                  ) : (
                    advisor.name || ''
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAdvisorId === advisor.id ? (
                    <select
                      value={editData.faculty_id}
                      onChange={(e) => onEditDataChange({ ...editData, faculty_id: e.target.value })}
                      className="w-full px-2 py-1 border rounded-md"
                    >
                      <option value="">-- Chọn khoa --</option>
                      {faculties.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    advisor.Faculty?.name || advisor.Faculty?.faculty_name || ''
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAdvisorId === advisor.id ? (
                    <input
                      type="text"
                      value={editData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (validatePhoneInput(value)) {
                          onEditDataChange({ ...editData, phone: value });
                        }
                      }}
                      className="w-full px-2 py-1 border rounded-md"
                      placeholder="Nhập số điện thoại"
                      maxLength={10}
                    />
                  ) : (
                    advisor.phone || ''
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {editingAdvisorId === advisor.id ? (
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => handleSave(advisor.id)}
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
                          onClick={() => handleViewDetail(advisor.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <ReceiptText size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa cố vấn" placement="top">
                        <button
                          onClick={() => onEditClick(advisor)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <SquarePen size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Xóa cố vấn" placement="top">
                        <button
                          onClick={() => onDeleteAdvisor(advisor.id)}
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
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                Không có cố vấn học tập nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 