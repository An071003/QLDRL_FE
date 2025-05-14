"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import Loading from "../Loading";

interface Props {
  onImport: (students: { mssv: string }[]) => Promise<{ success: boolean }>;
}

export default function StudentActivitiesImport({ onImport }: Props) {
  const [loading, setLoading] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<{ mssv: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const students: { mssv: string }[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const cell = row.getCell(1).value;
        if (cell) {
          const mssv = typeof cell === "number" ? cell.toString() : cell.toString().trim();
          students.push({ mssv });
        }
      });

      if (!students.length) {
        toast.error("File Excel không chứa dữ liệu hợp lệ");
      } else {
        setPreviewStudents(students);
      }
    } catch (error) {
      console.error(error);
      toast.error("Đọc file Excel thất bại ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (index: number, value: string) => {
    setPreviewStudents((prev) => {
      const updated = [...prev];
      updated[index].mssv = value;
      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    setPreviewStudents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (!previewStudents.length) return;
    setLoading(true);

    const hasEmpty = previewStudents.some((s) => !s.mssv.trim());
    if (hasEmpty) {
      toast.error("Mã số sinh viên không được để trống");
      setLoading(false);
      return;
    }

    const result = await onImport(previewStudents);
    if (result.success) {
      toast.success("Import thành công ✅");
      setPreviewStudents([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    setLoading(false);
  };

  if (loading) return <Loading />;

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
        <div className="bg-white rounded-lg shadow overflow-x-auto mt-6">
          <h3 className="text-xl font-bold mb-4">Danh sách sinh viên</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {previewStudents.map((student, idx) => (
                <tr key={idx} className="text-center border-b">
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="text"
                      value={student.mssv}
                      onChange={(e) => handleStudentChange(idx, e.target.value)}
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
              Thêm sinh viên
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
