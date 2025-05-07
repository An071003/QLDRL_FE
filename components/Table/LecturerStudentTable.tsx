'use client';

import { Tooltip } from 'antd';
import { ReceiptText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Student } from '@/types/student';

interface Props {
  students: Student[];
}

export default function LecturerStudentTable({ students }: Props) {
  const router = useRouter();

  const handleViewActivities = (id: string) => {
    router.push(`/uit/lecturer/students/${id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MSSV</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khoa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khóa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng DRL</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student.id}>
              <td className="px-4 py-3 whitespace-nowrap">{student.id}</td>
              <td className="px-4 py-3 whitespace-nowrap">{student.student_name}</td>
              <td className="px-4 py-3 whitespace-nowrap">{student.faculty}</td>
              <td className="px-4 py-3 whitespace-nowrap">{student.year}</td>
              <td className="px-4 py-3 whitespace-nowrap">{student.class}</td>
              <td className="px-4 py-3 whitespace-nowrap">{student.total_score}</td>
              <td className="px-4 py-3 text-center whitespace-nowrap flex gap-2 justify-center">
                <Tooltip title="Xem hoạt động đã tham gia">
                  <button
                    onClick={() => handleViewActivities(student.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <ReceiptText size={20} />
                  </button>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
