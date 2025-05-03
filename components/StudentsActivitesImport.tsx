"use client";

import { useState } from "react";
import { toast } from "sonner";
import ExcelJS from "exceljs";

interface Props {
  onImport: (students: { mssv: string }[]) => void;
}

export default function StudentActivitiesImport({ onImport }: Props) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  const handleImport = async () => {
    if (!file) {
      toast.warning("Vui lòng chọn file Excel trước");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      const students: { mssv: string }[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const mssvCell = row.getCell(1).value;
        if (mssvCell && typeof mssvCell === "string") {
          students.push({ mssv: mssvCell.trim() });
        } else if (typeof mssvCell === "number") {
          students.push({ mssv: mssvCell.toString() });
        }
      });

      if (!students.length) {
        toast.error("File Excel không chứa dữ liệu hợp lệ");
        return;
      }

      onImport(students);
    } catch (err) {
      console.error(err);
      toast.error("Đọc file Excel thất bại ❌");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Import sinh viên từ Excel</h2>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleImport}
        className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Nhập dữ liệu
      </button>
    </div>
  );
}
