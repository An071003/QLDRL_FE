"use client";

import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import ExcelJS from "exceljs";

interface CriteriaImportProps {
  onCriteriasImported: (criterias: { name: string; max_score: number }[]) => Promise<{ success: boolean }>;
}

export default function CriteriaImport({ onCriteriasImported }: CriteriaImportProps) {
  const [loading, setLoading] = useState(false);
  const [previewCriterias, setPreviewCriterias] = useState<{ name: string; max_score: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const criterias: { name: string; max_score: number }[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const name = row.getCell(1).value?.toString() || "";
        const max_score = Number(row.getCell(2).value) || 0;

        if (name) {
          criterias.push({ name, max_score });
        }
      });

      setPreviewCriterias(criterias);
    } catch (err) {
      console.error("Error reading file:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (previewCriterias.length > 0) {
      const result = await onCriteriasImported(previewCriterias);
      if (result.success) {
        setPreviewCriterias([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">
          Import tiêu chí từ file Excel
        </p>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer">
          {loading ? "Đang tải..." : "Chọn file"}
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

      {previewCriterias.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Xem trước Tiêu chí</h3>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Tên tiêu chí</th>
                <th className="border p-2">Điểm tối đa</th>
              </tr>
            </thead>
            <tbody>
              {previewCriterias.map((criteria, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{criteria.name}</td>
                  <td className="border p-2">{criteria.max_score}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Tạo Tiêu chí
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
