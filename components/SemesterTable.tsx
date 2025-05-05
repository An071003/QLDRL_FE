'use client';

import { Semester } from '@/types/semester';
import Loading from './Loading';
import { Trash } from 'lucide-react';
import { Tooltip } from 'antd';

interface SemesterTableProps {
  semesters: Semester[];
  loading: boolean;
  onDeleteSemester: (id: number) => void;
}

export default function SemesterTable({ semesters, loading, onDeleteSemester }: SemesterTableProps) {
  if (loading) {
    return (
      <Loading/>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên học kỳ</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Năm học</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {semesters.map((semester, index) => (
            <tr key={semester.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{semester.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{`${semester.start_year} - ${semester.end_year}`}</td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <Tooltip title="Xóa học kỳ" placement="top">
                <button
                  onClick={() => onDeleteSemester(semester.id)}
                  className="cursor-pointer text-red-600 hover:text-red-900 ml-2"
                >
                  <Trash size={20} />
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
