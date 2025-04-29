'use client';

interface Student {
  id: string;
  student_name: string;
  faculty: string;
  course: string;
  class: string;
  sumscore: number | null;
}

interface LecturerStudentTableProps {
  students: Student[];
}

export default function LecturerStudentTable({ students }: LecturerStudentTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Sinh viên</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng điểm</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student, index) => (
            <tr key={student.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{student.id}</td>
              <td className="px-6 py-4 whitespace-nowrap">{student.student_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{student.faculty}</td>
              <td className="px-6 py-4 whitespace-nowrap">{student.course}</td>
              <td className="px-6 py-4 whitespace-nowrap">{student.class}</td>
              <td className="px-6 py-4 whitespace-nowrap">{student.sumscore ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
