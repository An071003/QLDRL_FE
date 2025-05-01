"use client";

import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import ExcelJS from "exceljs";

type Campaign = {
  name: string;
  max_score: number;
  criteria_id: number;
  is_negative: boolean;
  negativescore: number;
};

interface CampaignImportProps {
  onCampaignsImported: (campaigns: Campaign[]) => Promise<{ success: boolean }>;
}

export default function CampaignImport({ onCampaignsImported }: CampaignImportProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCampaigns, setPreviewCampaigns] = useState<Campaign[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const campaigns: Campaign[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const name = row.getCell(1).value?.toString() || "";
        const max_score = Number(row.getCell(2).value) || 0;
        const criteria_id = Number(row.getCell(3).value) || 0;
        const is_negative = row.getCell(4).value?.toString()?.toLowerCase() === "true";
        const negativescore = is_negative ? Number(row.getCell(5).value) || 0 : 0;

        if (!name || isNaN(max_score) || isNaN(criteria_id)) {
          console.warn(`Invalid row ${rowNumber}`);
          return;
        }

        campaigns.push({ name, max_score, criteria_id, is_negative, negativescore });
      });

      setPreviewCampaigns(campaigns);
    } catch (err) {
      console.error("Error reading file:", err);
      setError("Không đọc được file. Vui lòng kiểm tra định dạng Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, key: keyof Campaign, value: string | number | boolean) => {
    setPreviewCampaigns((prev) => {
      const updated = [...prev];
      updated[index][key] = value as never;
      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    setPreviewCampaigns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (previewCampaigns.length > 0) {
      setImporting(true);
      const result = await onCampaignsImported(previewCampaigns);
      setImporting(false);
      if (result.success) {
        setPreviewCampaigns([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        alert("Import thành công!");
      }
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import phong trào từ file Excel</p>
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
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {previewCampaigns.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Xem trước & chỉnh sửa Phong trào</h3>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Tên phong trào</th>
                <th className="border p-2">Điểm tối đa</th>
                <th className="border p-2">ID tiêu chí</th>
                <th className="border p-2">Điểm trừ?</th>
                <th className="border p-2">Điểm trừ</th>
                <th className="border p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {previewCampaigns.map((c, idx) => (
                <tr key={idx}>
                  <td className="border p-2">
                    <input
                      type="text"
                      className="w-full border rounded p-1"
                      value={c.name}
                      onChange={(e) => handleChange(idx, "name", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-full border rounded p-1"
                      value={c.max_score}
                      onChange={(e) => handleChange(idx, "max_score", Number(e.target.value))}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-full border rounded p-1"
                      value={c.criteria_id}
                      onChange={(e) => handleChange(idx, "criteria_id", Number(e.target.value))}
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <input
                      type="checkbox"
                      checked={c.is_negative}
                      onChange={(e) => handleChange(idx, "is_negative", e.target.checked)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-full border rounded p-1"
                      value={c.negativescore}
                      onChange={(e) => handleChange(idx, "negativescore", Number(e.target.value))}
                      disabled={!c.is_negative}
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
                importing ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {importing ? "Đang import..." : "Tạo phong trào"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
