"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { UploadCloud } from "lucide-react";

export default function CriteriaImport({
  onImported,
}: {
  onImported: (criterias: any[]) => Promise<{ success: boolean }>; // Thay đổi từ ICriteria[] thành any[]
}) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewCriterias, setPreviewCriterias] = useState<any[]>([]); // Thay đổi từ ICriteria[] thành any[]
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const criterias: any[] = []; // Sử dụng any[]

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const name = row.getCell(1).value?.toString() || "";
        const max_score = Number(row.getCell(2).value) || 0;
        criterias.push({ name, max_score });
      });

      setPreviewCriterias(criterias);
    } catch (err) {
      console.error("Lỗi đọc file:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, key: string, value: string | number) => { 
    setPreviewCriterias(prev => {
      const updated = [...prev];
      updated[index][key] = value;
      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    setPreviewCriterias(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (previewCriterias.length > 0) {
      setImporting(true);
      const result = await onImported(previewCriterias);
      setImporting(false);

      if (result.success) {
        setPreviewCriterias([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import Criteria from Excel</p>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer">
          {loading ? "Loading..." : "Choose File"}
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
          <h3 className="text-xl font-bold mb-4">Preview & Edit Criteria</h3>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Tên tiêu chí</th>
                <th className="border p-2">Điểm tối đa</th>
                <th className="border p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {previewCriterias.map((c, idx) => (
                <tr key={idx}>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="text"
                      value={c.name}
                      onChange={(e) => handleChange(idx, "name", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="number"
                      value={c.max_score}
                      onChange={(e) => handleChange(idx, "max_score", e.target.value)}
                    />
                  </td>
                  <td className="border p-2 text-center">
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
              disabled={importing}
              className={`px-6 py-2 rounded text-white ${
                importing ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
