"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { UploadCloud, Download, Trash, RefreshCw, Plus, SquarePen } from "lucide-react";
import { Tooltip } from "antd";
import Loading from "@/components/Loading";

type Campaign = {
  name: string;
  max_score: number;
  criteria_id: number;
  semester_no: number;
  academic_year: number;
  created_by: number;
  row_number?: number;
  error?: string;
};

interface CampaignImportProps {
  onCampaignsImported: (campaigns: Campaign[]) => Promise<{ success: boolean }>;
}

export default function CampaignImport({ onCampaignsImported }: CampaignImportProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCampaigns, setPreviewCampaigns] = useState<Campaign[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalCampaignBeforeEdit, setOriginalCampaignBeforeEdit] = useState<Campaign | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateCampaign = (campaign: Campaign) => {
    const nameError = !campaign.name || campaign.name.trim() === '';
    const maxScoreError = isNaN(campaign.max_score) || campaign.max_score <= 0;
    const criteriaIdError = isNaN(campaign.criteria_id) || campaign.criteria_id <= 0;
    const semesterNoError = ![1, 2, 3].includes(campaign.semester_no);
    const academicYearError = isNaN(campaign.academic_year) || campaign.academic_year < 2000;
    
    return { nameError, maxScoreError, criteriaIdError, semesterNoError, academicYearError };
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    const campaigns: Campaign[] = [];

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
        toast.error('File Excel không có dữ liệu phong trào. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

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

        if (!name && isNaN(max_score) && isNaN(criteria_id)) {
          return; // Skip completely empty rows
        }

        campaigns.push({ 
          name, 
          max_score, 
          criteria_id, 
          semester_no, 
          academic_year, 
          created_by: 1,
          row_number: rowNumber 
        });
      });

      if (campaigns.length === 0) {
        toast.error('Không tìm thấy dữ liệu phong trào hợp lệ trong file.');
        setLoading(false);
        return;
      }

      setPreviewCampaigns(campaigns);
      setShowErrors(false);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(`Đã tải lên ${campaigns.length} phong trào từ file Excel.`);
    } catch (err) {
      console.error("Error reading file:", err);
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
    const currentYear = new Date().getFullYear();
    setPreviewCampaigns(prev => [
      ...prev,
      {
        name: '',
        max_score: 0,
        criteria_id: 0,
        semester_no: 1,
        academic_year: currentYear,
        created_by: 1,
        row_number: prev.length > 0 ? Math.max(...prev.map(c => c.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewCampaigns.length);
    setEditErrors({});
  };

  const handleChange = (index: number, key: keyof Campaign, value: string | number | boolean) => {
    setPreviewCampaigns((prev) => {
      const updated = [...prev];
      updated[index][key] = value as never;
      return updated;
    });
    
    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewCampaigns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditRow = (index: number) => {
    setOriginalCampaignBeforeEdit(JSON.parse(JSON.stringify(previewCampaigns[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && originalCampaignBeforeEdit) {
      setPreviewCampaigns(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalCampaignBeforeEdit;
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalCampaignBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const campaign = previewCampaigns[editingIndex];
    const { nameError, maxScoreError, criteriaIdError, semesterNoError, academicYearError } = validateCampaign(campaign);

    if (nameError || maxScoreError || criteriaIdError || semesterNoError || academicYearError) {
      setEditErrors({
        name: nameError,
        max_score: maxScoreError,
        criteria_id: criteriaIdError,
        semester_no: semesterNoError,
        academic_year: academicYearError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalCampaignBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidCampaigns = previewCampaigns.filter(campaign => {
      const { nameError, maxScoreError, criteriaIdError, semesterNoError, academicYearError } = validateCampaign(campaign);
      return nameError || maxScoreError || criteriaIdError || semesterNoError || academicYearError;
    });

    if (invalidCampaigns.length > 0) {
      toast.error(`Có ${invalidCampaigns.length} phong trào chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      return;
    }

    if (previewCampaigns.length === 0) {
      toast.error("Không có dữ liệu để import.");
      return;
    }

    setImporting(true);
    try {
      const campaignsWithCreatedBy = previewCampaigns.map(campaign => ({
        ...campaign,
        created_by: 1 // Default to ID 1 for admin user
      }));
      
      const result = await onCampaignsImported(campaignsWithCreatedBy);
      if (result.success) {
        setPreviewCampaigns([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
        toast.success("Import phong trào thành công!");
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
        name: 'Phong trào học kỳ 1 mẫu',
        max_score: 100,
        criteria_id: 1,
        semester_no: 1,
        academic_year: new Date().getFullYear(),
      });
      
      worksheet.addRow({
        name: 'Phong trào học kỳ 2 mẫu',
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

  if (loading) return <Loading />;

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import phong trào từ file Excel</p>
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
            <span>{previewCampaigns.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
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

      {previewCampaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Xem trước & chỉnh sửa Phong trào</h3>
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
              <li><strong>Học kỳ (Semester):</strong> Chỉ nhận giá trị 1 (Học kỳ 1), 2 (Học kỳ 2), hoặc 3 (Học kỳ hè)</li>
              <li><strong>Năm học (Academic year):</strong> Năm học, ví dụ: 2024</li>
              <li><strong>Điểm tối đa:</strong> Số điểm tối đa cho phong trào (phải là số dương)</li>
              <li><strong>ID tiêu chí:</strong> ID của tiêu chí đã tồn tại trong hệ thống</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phong trào</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm tối đa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID tiêu chí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Năm học</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewCampaigns.map((campaign, index) => {
                const { nameError, maxScoreError, criteriaIdError, semesterNoError, academicYearError } = validateCampaign(campaign);
                const hasError = nameError || maxScoreError || criteriaIdError || semesterNoError || academicYearError;
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-6 py-4 ${showErrors && nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={campaign.name}
                            onChange={(e) => handleChange(index, "name", e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && nameError) || editErrors.name ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && nameError) || editErrors.name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên phong trào</p>
                          )}
                        </>
                      ) : (
                        <span className={nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {campaign.name || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${showErrors && maxScoreError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={campaign.max_score}
                            onChange={(e) => handleChange(index, "max_score", Number(e.target.value))}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && maxScoreError) || editErrors.max_score ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && maxScoreError) || editErrors.max_score) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Điểm tối đa phải lớn hơn 0</p>
                          )}
                        </>
                      ) : (
                        <span className={maxScoreError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {campaign.max_score || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${showErrors && criteriaIdError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={campaign.criteria_id}
                            onChange={(e) => handleChange(index, "criteria_id", Number(e.target.value))}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && criteriaIdError) || editErrors.criteria_id ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && criteriaIdError) || editErrors.criteria_id) && (
                            <p className="text-xs text-red-600 font-medium mt-1">ID tiêu chí phải lớn hơn 0</p>
                          )}
                        </>
                      ) : (
                        <span className={criteriaIdError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {campaign.criteria_id || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${showErrors && semesterNoError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <select
                            className={`w-full border rounded px-2 py-1 ${(showErrors && semesterNoError) || editErrors.semester_no ? 'border-red-600 bg-red-50' : ''}`}
                            value={campaign.semester_no}
                            onChange={(e) => handleChange(index, "semester_no", Number(e.target.value))}
                          >
                            <option value={1}>Học kỳ 1</option>
                            <option value={2}>Học kỳ 2</option>
                            <option value={3}>Học kỳ hè</option>
                          </select>
                          {((showErrors && semesterNoError) || editErrors.semester_no) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Chọn học kỳ hợp lệ</p>
                          )}
                        </>
                      ) : (
                        <span className={semesterNoError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {campaign.semester_no === 1 ? "Học kỳ 1" : 
                           campaign.semester_no === 2 ? "Học kỳ 2" : 
                           campaign.semester_no === 3 ? "Học kỳ hè" : "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${showErrors && academicYearError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={campaign.academic_year}
                            onChange={(e) => handleChange(index, "academic_year", Number(e.target.value))}
                            min={2000}
                            max={2100}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && academicYearError) || editErrors.academic_year ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && academicYearError) || editErrors.academic_year) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Năm học không hợp lệ</p>
                          )}
                        </>
                      ) : (
                        <span className={academicYearError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {campaign.academic_year || "-"}
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
                              Lưu
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                            >
                              Hủy
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
                                <Trash size={16} />
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
              {importing ? "Đang import..." : "Import Phong trào"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
