"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { UploadCloud, Download } from "lucide-react";
import { toast } from "sonner";

type Criteria = {
  name: string;
  max_score: number;
  created_by?: number;
};

interface CriteriaImportProps {
  onImported: (criterias: Criteria[]) => Promise<{ success: boolean }>;
}

export default function CriteriaImport({ onImported }: CriteriaImportProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCriterias, setPreviewCriterias] = useState<Criteria[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to generate and download a sample Excel template
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Criteria Template');
      
      // Add headers
      worksheet.columns = [
        { header: 'Tên tiêu chí', key: 'name', width: 30 },
        { header: 'Điểm tối đa', key: 'max_score', width: 15 },
      ];
      
      // Add some sample data
      worksheet.addRow({
        name: 'Rèn luyện học kỳ',
        max_score: 100,
      });
      
      worksheet.addRow({
        name: 'Hoạt động ngoại khóa',
        max_score: 50,
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
      a.download = 'criteria_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Tải xuống mẫu thành công!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Có lỗi khi tạo file mẫu.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const criterias: Criteria[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const name = row.getCell(1).value?.toString() || "";
        const max_score = Number(row.getCell(2).value) || 0;
        
        if (!name || isNaN(max_score)) {
          console.warn(`Invalid row ${rowNumber}`);
          return;
        }
        
        criterias.push({ name, max_score, created_by: 1 });
      });

      setPreviewCriterias(criterias);
    } catch (err) {
      console.error("Lỗi đọc file:", err);
      setError("Không đọc được file. Vui lòng kiểm tra định dạng Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, key: keyof Criteria, value: string | number) => { 
    setPreviewCriterias((prev) => {
      const updated = [...prev];
      if (key === 'name') {
        updated[index][key] = value as string;
      } else if (key === 'max_score') {
        updated[index][key] = value as number;
      }
      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    setPreviewCriterias(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (previewCriterias.length > 0) {
      setImporting(true);
      try {
        console.log("Importing criteria:", previewCriterias);
        const criteriaWithCreatedBy = previewCriterias.map(criteria => ({
          ...criteria,
          created_by: 1 // Default to ID 1 for admin user
        }));
        console.log("Criteria with created_by:", criteriaWithCreatedBy);
        
        const result = await onImported(criteriaWithCreatedBy);
        if (result.success) {
          setPreviewCriterias([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
          toast.success("Import tiêu chí thành công!");
        } else {
          toast.error("Import thất bại. Vui lòng kiểm tra lại dữ liệu.");
        }
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Có lỗi xảy ra khi import.");
      } finally {
        setImporting(false);
      }
    } else {
      toast.error("Không có dữ liệu để import.");
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import Tiêu chí từ file Excel</p>
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

      {previewCriterias.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Xem trước & chỉnh sửa Tiêu chí</h3>
          <div className="mb-4 bg-blue-50 p-4 rounded-md text-sm">
            <p className="mb-2 font-semibold">Lưu ý về định dạng dữ liệu:</p>
            <ul className="list-disc pl-4">
              <li><strong>Tên tiêu chí:</strong> Tên mô tả tiêu chí đánh giá</li>
              <li><strong>Điểm tối đa:</strong> Số điểm tối đa của tiêu chí</li>
            </ul>
          </div>
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
                      onChange={(e) => handleChange(idx, "max_score", Number(e.target.value))}
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
                importing ? 'bg-green-400 cursor-not-allowed' : 'cursor-pointer bg-green-600 hover:bg-green-700'
              }`}
            >
              {importing ? 'Đang import...' : 'Import Tiêu chí'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
