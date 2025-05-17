"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { UploadCloud, Download, Trash2, Check, X, RefreshCw, Plus, SquarePen } from "lucide-react";
import { Tooltip } from "antd";
import Loading from "@/components/Loading";

type Criteria = {
  name: string;
  max_score: number;
  created_by?: number;
  row_number?: number;
  error?: string;
};

interface CriteriaImportProps {
  onImported: (criterias: Criteria[]) => Promise<{ success: boolean }>;
}

export default function CriteriaImport({ onImported }: CriteriaImportProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCriterias, setPreviewCriterias] = useState<Criteria[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalCriteriaBeforeEdit, setOriginalCriteriaBeforeEdit] = useState<Criteria | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateCriteria = (criteria: Criteria) => {
    const nameError = !criteria.name || criteria.name.trim() === '';
    const maxScoreError = isNaN(criteria.max_score) || criteria.max_score <= 0;
    
    return { nameError, maxScoreError };
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    const criterias: Criteria[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      if (workbook.worksheets.length === 0) {
        toast.error('File Excel không có dữ liệu. Vui lòng kiểm tra lại file.');
        setLoading(false);
        return;
      }

      const worksheet = workbook.worksheets[0];

      if (worksheet.rowCount <= 1) {
        toast.error('File Excel không có dữ liệu tiêu chí. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const name = row.getCell(1).value?.toString() || "";
        const max_score = Number(row.getCell(2).value) || 0;
        
        if (!name && isNaN(max_score)) {
          return; // Skip completely empty rows
        }
        
        criterias.push({ 
          name, 
          max_score, 
          created_by: 1,
          row_number: rowNumber 
        });
      });

      if (criterias.length === 0) {
        toast.error('Không tìm thấy dữ liệu tiêu chí hợp lệ trong file.');
        setLoading(false);
        return;
      }

      setPreviewCriterias(criterias);
      setShowErrors(false);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(`Đã tải lên ${criterias.length} tiêu chí từ file Excel.`);
    } catch (err) {
      console.error("Lỗi đọc file:", err);
      setError("Không đọc được file. Vui lòng kiểm tra định dạng Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processExcelFile(file);
    resetFileInput();
  };

  const resetFileInput = () => {
    setFileKey(Date.now().toString());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReselect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddRow = () => {
    setPreviewCriterias(prev => [
      ...prev,
      {
        name: '',
        max_score: 0,
        created_by: 1,
        row_number: prev.length > 0 ? Math.max(...prev.map(c => c.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewCriterias.length);
    setEditErrors({});
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
    
    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewCriterias(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditRow = (index: number) => {
    setOriginalCriteriaBeforeEdit(JSON.parse(JSON.stringify(previewCriterias[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && originalCriteriaBeforeEdit) {
      setPreviewCriterias(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalCriteriaBeforeEdit;
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalCriteriaBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const criteria = previewCriterias[editingIndex];
    const { nameError, maxScoreError } = validateCriteria(criteria);

    if (nameError || maxScoreError) {
      setEditErrors({
        name: nameError,
        max_score: maxScoreError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalCriteriaBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidCriterias = previewCriterias.filter(criteria => {
      const { nameError, maxScoreError } = validateCriteria(criteria);
      return nameError || maxScoreError;
    });

    if (invalidCriterias.length > 0) {
      toast.error(`Có ${invalidCriterias.length} tiêu chí chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      return;
    }

    if (previewCriterias.length === 0) {
      toast.error("Không có dữ liệu để import.");
      return;
    }

    setImporting(true);
    try {
      const criteriaWithCreatedBy = previewCriterias.map(criteria => ({
        ...criteria,
        created_by: 1 // Default to ID 1 for admin user
      }));
      
      const result = await onImported(criteriaWithCreatedBy);
      if (result.success) {
        setPreviewCriterias([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
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
  };

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

  if (loading) return <Loading />;

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import tiêu chí từ file Excel</p>
        <input
          ref={fileInputRef}
          key={fileKey}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
        />
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleReselect}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-1"
            disabled={loading}
          >
            <UploadCloud size={16} />
            <span>{previewCriterias.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
          </button>
          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Download size={18} />
            Tải mẫu Excel
          </button>
        </div>
        {lastUpdated && (
          <p className="mt-2 text-sm text-gray-600">
            Dữ liệu được cập nhật lúc: {lastUpdated}
          </p>
        )}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {previewCriterias.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Xem trước & chỉnh sửa Tiêu chí</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddRow}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                title="Thêm hàng mới"
              >
                <Plus size={16} />
                <span>Thêm Hàng</span>
              </button>
              <button
                onClick={handleReselect}
                className="text-blue-600 flex items-center gap-1 hover:text-blue-800"
                title="Chọn lại file từ máy tính để xem phiên bản mới nhất"
              >
                <RefreshCw size={16} />
                <span>Chọn lại file</span>
              </button>
            </div>
          </div>
          
          <div className="mb-4 p-4 bg-blue-50 text-sm border-b">
            <p className="mb-2 font-semibold">Lưu ý về định dạng dữ liệu:</p>
            <ul className="list-disc pl-4">
              <li><strong>Tên tiêu chí:</strong> Tên mô tả tiêu chí đánh giá</li>
              <li><strong>Điểm tối đa:</strong> Số điểm tối đa của tiêu chí (phải là số dương)</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên tiêu chí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm tối đa</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewCriterias.map((criteria, index) => {
                const { nameError, maxScoreError } = validateCriteria(criteria);
                const hasError = nameError || maxScoreError;
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-6 py-4 ${showErrors && nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={criteria.name}
                            onChange={(e) => handleChange(index, "name", e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && nameError) || editErrors.name ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && nameError) || editErrors.name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên tiêu chí</p>
                          )}
                        </>
                      ) : (
                        <span className={nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {criteria.name || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${showErrors && maxScoreError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={criteria.max_score}
                            onChange={(e) => handleChange(index, "max_score", Number(e.target.value))}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && maxScoreError) || editErrors.max_score ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && maxScoreError) || editErrors.max_score) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Điểm tối đa phải lớn hơn 0</p>
                          )}
                        </>
                      ) : (
                        <span className={maxScoreError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {criteria.max_score || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                            >
                              <Check size={16} />
                              <span>Lưu</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                            >
                              <X size={16} />
                              <span>Hủy</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Sửa">
                              <button
                                onClick={() => handleEditRow(index)}
                                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                disabled={editingIndex !== null}
                              >
                                <SquarePen size={20} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                                disabled={editingIndex !== null}
                              >
                                <Trash2 size={16} />
                              </button>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-4 flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing}
              className={`px-6 py-2 rounded text-white ${
                importing ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {importing ? "Đang import..." : "Import Tiêu chí"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
