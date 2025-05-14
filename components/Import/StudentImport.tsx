"use client";

import { useState, useRef } from 'react';
import { UploadCloud } from "lucide-react";
import ExcelJS from 'exceljs';
import { toast } from 'sonner';

export default function StudentImport({
  onStudentsImported,
  setLoadingManager
}: {
  onStudentsImported: (students: any[]) => Promise<{ success: boolean }>;
  setLoadingManager: (value: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const students: any[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const id = row.getCell(1).value?.toString() || '';
        const student_name = row.getCell(2).value?.toString() || '';
        const faculty = row.getCell(3).value?.toString() || '';
        const course = row.getCell(4).value?.toString() || '';
        const className = row.getCell(5).value?.toString() || '';

        if (id && student_name && className) {
          students.push({
            id,
            student_name,
            faculty,
            course,
            class: className,
            email: `${id}@gm.uit.edu.vn`,
            role: 'student'
          });
        }
      });

      setPreviewStudents(students);
    } catch (err) {
      console.error('Lỗi đọc file Excel:', err);
      toast.error("Không đọc được file Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (index: number, key: string, value: string) => {
    setPreviewStudents(prev => {
      const updated = [...prev];
      updated[index][key] = value;
      updated[index].email = `${updated[index].id}@gm.uit.edu.vn`;
      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    setPreviewStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    setLoadingManager(true);
    if (previewStudents.length > 0) {
      const result = await onStudentsImported(previewStudents);

      if (result.success) {
        setPreviewStudents([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
    setLoadingManager(false);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import sinh viên từ Excel</p>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer">
          Chọn File
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>

      {previewStudents.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto mt-4">
          <h3 className="text-xl font-bold mb-4">Xem trước danh sách sinh viên</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">MSSV</th>
                <th className="px-4 py-2">Họ tên</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Khoa</th>
                <th className="px-4 py-2">Khóa</th>
                <th className="px-4 py-2">Lớp</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {previewStudents.map((student, idx) => (
                <tr key={idx} className="text-center border-b">
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="text"
                      value={student.id}
                      onChange={(e) => handleStudentChange(idx, "id", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="text"
                      value={student.student_name}
                      onChange={(e) => handleStudentChange(idx, "student_name", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">{student.email}</td>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="text"
                      value={student.faculty}
                      onChange={(e) => handleStudentChange(idx, "faculty", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="text"
                      value={student.course}
                      onChange={(e) => handleStudentChange(idx, "course", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="text"
                      value={student.class}
                      onChange={(e) => handleStudentChange(idx, "class", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleImport}
              className="px-6 py-2 rounded text-white bg-green-500 hover:bg-green-700"
            >
              Tạo Sinh Viên
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
