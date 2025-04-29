"use client";

import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import ExcelJS from "exceljs";

interface CampaignImportProps {
  onCampaignsImported: (campaigns: {
    name: string;
    max_score: number;
    criteria_id: number;
    is_negative: boolean;
    negativescore: number;
  }[]) => Promise<{ success: boolean }>;
}

export default function CampaignImport({ onCampaignsImported }: CampaignImportProps) {
  const [loading, setLoading] = useState(false);
  const [previewCampaigns, setPreviewCampaigns] = useState<{
    name: string;
    max_score: number;
    criteria_id: number;
    is_negative: boolean;
    negativescore: number;
  }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const campaigns: {
      name: string;
      max_score: number;
      criteria_id: number;
      is_negative: boolean;
      negativescore: number;
    }[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Bỏ qua tiêu đề

        const name = row.getCell(1).value?.toString() || "";
        const max_score = Number(row.getCell(2).value) || 0;
        const criteria_id = Number(row.getCell(3).value) || 0;
        const is_negative = row.getCell(4).value?.toString()?.toLowerCase() === "true";
        const negativescore = Number(row.getCell(5).value) || 0;

        if (name && criteria_id) {
          campaigns.push({ name, max_score, criteria_id, is_negative, negativescore });
        }
      });

      setPreviewCampaigns(campaigns);
    } catch (err) {
      console.error("Error reading file:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (previewCampaigns.length > 0) {
      const result = await onCampaignsImported(previewCampaigns);
      if (result.success) {
        setPreviewCampaigns([]);
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
          Import phong trào từ file Excel
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

      {previewCampaigns.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Xem trước Phong trào</h3>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Tên phong trào</th>
                <th className="border p-2">Điểm tối đa</th>
                <th className="border p-2">ID tiêu chí</th>
                <th className="border p-2">Điểm trừ?</th>
                <th className="border p-2">Điểm trừ</th>
              </tr>
            </thead>
            <tbody>
              {previewCampaigns.map((campaign, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{campaign.name}</td>
                  <td className="border p-2">{campaign.max_score}</td>
                  <td className="border p-2">{campaign.criteria_id}</td>
                  <td className="border p-2">{campaign.is_negative ? "True" : "False"}</td>
                  <td className="border p-2">{campaign.negativescore}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Tạo Phong trào
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
