import { Class } from '@/types/class';
import { useRouter } from 'next/navigation';
import { ReceiptText } from 'lucide-react';
import { Tooltip } from 'antd';

interface AdvisorClassesProps {
  classes: Class[] | undefined;
  showActions?: boolean;
  handleViewDetail?: (classId: number) => void;
}

export default function AdvisorClasses({ 
  classes, 
  showActions = true,
  handleViewDetail: customHandleViewDetail
}: AdvisorClassesProps) {
  const router = useRouter();
  
  const handleViewDetail = (classId: number) => {
    if (customHandleViewDetail) {
      customHandleViewDetail(classId);
    } else {
      router.push(`/uit/advisor/classes/${classId}`);
    }
  };

  if (!classes || classes.length === 0) {
    return (
      <div className="px-6 py-4 bg-gray-50 text-gray-500 text-center">
        Chưa được phân công lớp nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên lớp</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khóa</th>
            {showActions && (
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {classes.map((cls, index) => (
            <tr key={cls.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
              <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{cls.name}</td>
              <td className="px-4 py-3 whitespace-nowrap">{cls.cohort || "--"}</td>
              {showActions && (
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-2">
                    <Tooltip title="Xem chi tiết lớp">
                      <button
                        onClick={() => handleViewDetail(cls.id)}
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
                      >
                        <ReceiptText size={20} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 