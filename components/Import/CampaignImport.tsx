"use client";

import { useState, useRef } from "react";
import { UploadCloud, Download } from "lucide-react";
import ExcelJS from "exceljs";
import { toast } from "sonner";

type Campaign = {
  name: string;
  max_score: number;
  criteria_id: number;
  semester_no: number;
  academic_year: number;
  created_by: number;
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
        let semester_no = Number(row.getCell(4).value) || 1;
        const academic_year = Number(row.getCell(5).value) || new Date().getFullYear();

        // Validate semester_no to be 1, 2, or 3
        if (semester_no > 3) {
          // If value is large (like a year), assume it's semester 1
          semester_no = 1;
        }
        
        // Ensure semester_no is only 1, 2, or 3
        semester_no = Math.min(Math.max(1, Math.round(semester_no)), 3);

        if (!name || isNaN(max_score) || isNaN(criteria_id) || isNaN(semester_no) || isNaN(academic_year)) {
          console.warn(`Invalid row ${rowNumber}`);
          return;
        }

        campaigns.push({ name, max_score, criteria_id, semester_no, academic_year, created_by: 1 });
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
      try {
        console.log("Importing campaigns:", previewCampaigns);
        // Add created_by field to each campaign
        const campaignsWithCreatedBy = previewCampaigns.map(campaign => ({
          ...campaign,
          created_by: 1 // Default to ID 1 for admin user
        }));
        console.log("Campaigns with created_by:", campaignsWithCreatedBy);
        const result = await onCampaignsImported(campaignsWithCreatedBy);
        setImporting(false);
        if (result.success) {
          setPreviewCampaigns([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
          toast.success("Import phong trào thành công!");
        } else {
          toast.error("Import thất bại. Vui lòng kiểm tra lại dữ liệu.");
        }
      } catch (error) {
        console.error("Import error:", error);
        setImporting(false);
        toast.error("Có lỗi xảy ra khi import.");
      }
    } else {
      toast.error("Không có dữ liệu để import.");
    }
  };

  // Function to generate and download a sample Excel template
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Campaign Template');
      
      // Add headers
      worksheet.columns = [
        { header: 'Tên phong trào', key: 'name', width: 30 },
        { header: 'Điểm tối đa', key: 'max_score', width: 15 },
        { header: 'ID tiêu chí', key: 'criteria_id', width: 15 },
        { header: 'Học kỳ (1, 2, hoặc 3)', key: 'semester_no', width: 20 },
        { header: 'Năm học', key: 'academic_year', width: 15 },
      ];
      
      // Add some sample data
      worksheet.addRow({
        name: 'Chiến dịch học kỳ 1 mẫu',
        max_score: 100,
        criteria_id: 1,
        semester_no: 1,
        academic_year: new Date().getFullYear(),
      });
      
      worksheet.addRow({
        name: 'Chiến dịch học kỳ 2 mẫu',
        max_score: 90,
        criteria_id: 2,
        semester_no: 2,
        academic_year: new Date().getFullYear(),
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FF000000' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };
      
      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Create blob and download
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaign_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Tải xuống mẫu thành công!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Có lỗi khi tạo file mẫu.');
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import phong trào từ file Excel</p>
        <div className="flex gap-4 mb-4">
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
          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Download size={18} />
            Tải mẫu Excel
          </button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {previewCampaigns.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Xem trước & chỉnh sửa Phong trào</h3>
          <div className="mb-4 bg-blue-50 p-4 rounded-md text-sm">
            <p className="mb-2 font-semibold">Lưu ý về định dạng dữ liệu:</p>
            <ul className="list-disc pl-4">
              <li><strong>Học kỳ (Semester):</strong> Chỉ nhận giá trị 1 (Học kỳ 1), 2 (Học kỳ 2), hoặc 3 (Học kỳ hè)</li>
              <li><strong>Năm học (Academic year):</strong> Năm học, ví dụ: 2024</li>
            </ul>
          </div>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Tên phong trào</th>
                <th className="border p-2">Điểm tối đa</th>
                <th className="border p-2">ID tiêu chí</th>
                <th className="border p-2">Học kỳ</th>
                <th className="border p-2">Năm học</th>
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
                  <td className="border p-2">
                    <select
                      className="w-full border rounded p-1"
                      value={c.semester_no}
                      onChange={(e) => handleChange(idx, "semester_no", Number(e.target.value))}
                    >
                      <option value={1}>Học kỳ 1</option>
                      <option value={2}>Học kỳ 2</option>
                      <option value={3}>Học kỳ hè</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-full border rounded p-1"
                      value={c.academic_year}
                      onChange={(e) => handleChange(idx, "academic_year", Number(e.target.value))}
                      min={2000}
                      max={2100}
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
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
                importing ? "bg-green-400 cursor-not-allowed" : "cursor-pointer bg-green-600 hover:bg-green-700"
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
