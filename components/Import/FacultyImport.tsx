"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { UploadCloud, Download, Trash, RefreshCw, Plus, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { Tooltip } from 'antd';
import { Faculty } from "@/types/faculty";

type FacultyImportProps = {
  onFacultiesImported: (faculties: Partial<Faculty>[]) => Promise<{ success: boolean }>;
  setLoadingManager: (value: boolean) => void;
};

export default function FacultyImport({ onFacultiesImported, setLoadingManager }: FacultyImportProps) {
  const [loading, setLoading] = useState(false);
  const [previewFaculties, setPreviewFaculties] = useState<Partial<Faculty>[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalFacultyBeforeEdit, setOriginalFacultyBeforeEdit] = useState<Partial<Faculty> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFaculty = (faculty: Partial<Faculty>) => {
    return {
      nameError: !faculty.name || faculty.name.trim() === '',
      abbrError: !faculty.faculty_abbr || faculty.faculty_abbr.trim() === ''
    };
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    const faculties: Partial<Faculty>[] = [];

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
        toast.error('File Excel không có dữ liệu khoa. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const faculty_abbr = row.getCell(1).value?.toString().trim() || '';
        const name = row.getCell(2).value?.toString().trim() || '';

        if (!faculty_abbr || !name) {
          console.warn(`Invalid row ${rowNumber}`);
          return;
        }

        faculties.push({
          faculty_abbr,
          name,
          row_number: rowNumber
        });
      });

      if (faculties.length === 0) {
        toast.error('Không tìm thấy dữ liệu khoa hợp lệ trong file.');
        setLoading(false);
        return;
      }

      setPreviewFaculties(faculties);
      setShowErrors(false);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(`Đã tải lên ${faculties.length} khoa từ file Excel.`);
    } catch (err) {
      console.error('Error reading file:', err);
      toast.error('Lỗi khi đọc file Excel. Hãy đảm bảo file không bị hỏng và đúng định dạng .xlsx.');
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
    setPreviewFaculties(prev => [
      ...prev,
      {
        faculty_abbr: '',
        name: '',
        row_number: prev.length > 0 ? Math.max(...prev.map(f => f.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewFaculties.length);
    setEditErrors({});
  };

  const handleFacultyChange = (index: number, key: keyof Faculty, value: string) => {
    setPreviewFaculties(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewFaculties(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditRow = (index: number) => {
    setOriginalFacultyBeforeEdit(JSON.parse(JSON.stringify(previewFaculties[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && originalFacultyBeforeEdit) {
      setPreviewFaculties(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalFacultyBeforeEdit;
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalFacultyBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const faculty = previewFaculties[editingIndex];
    const { nameError, abbrError } = validateFaculty(faculty);

    if (nameError || abbrError) {
      setEditErrors({
        name: nameError,
        faculty_abbr: abbrError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalFacultyBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidFaculties = previewFaculties.filter(faculty => {
      const { nameError, abbrError } = validateFaculty(faculty);
      return nameError || abbrError;
    });

    if (invalidFaculties.length > 0) {
      toast.error(`Có ${invalidFaculties.length} khoa chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      return;
    }

    setLoadingManager(true);
    
    try {
      const result = await onFacultiesImported(previewFaculties);

      if (result.success) {
        toast.success(`Import thành công ${previewFaculties.length} khoa!`);
        setPreviewFaculties([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
      } else {
        toast.error('Lỗi khi import khoa. Vui lòng thử lại hoặc liên hệ quản trị viên.');
      }
    } catch (error) {
      console.error('Error importing faculties:', error);
      toast.error('Đã xảy ra lỗi khi xử lý dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
    } finally {
      setLoadingManager(false);
    }
  };

  // Function to generate and download a sample Excel template
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Faculty Import Template');
      
      // Add headers
      worksheet.columns = [
        { header: 'Mã khoa', key: 'faculty_abbr', width: 15 },
        { header: 'Tên khoa', key: 'name', width: 40 },
      ];
      
      // Add some sample data
      worksheet.addRow({
        faculty_abbr: 'CNTT',
        name: 'Công nghệ thông tin',
      });
      
      worksheet.addRow({
        faculty_abbr: 'KTPM',
        name: 'Kỹ thuật phần mềm',
      });
      
      worksheet.addRow({
        faculty_abbr: 'HTTT',
        name: 'Hệ thống thông tin',
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
      a.download = 'faculty_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Tải xuống mẫu Excel thành công!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Có lỗi khi tạo file mẫu.');
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import Khoa từ file Excel</p>
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
            <span>{previewFaculties.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
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
      </div>

      {previewFaculties.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Xem trước danh sách khoa</h3>
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
              <li><strong>Mã khoa:</strong> Viết tắt của khoa, không được để trống và phải là duy nhất</li>
              <li><strong>Tên khoa:</strong> Tên đầy đủ của khoa, không được để trống</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã khoa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên khoa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewFaculties.map((faculty, index) => {
                const { nameError, abbrError } = validateFaculty(faculty);
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && abbrError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={faculty.faculty_abbr || ''}
                            onChange={(e) => handleFacultyChange(index, 'faculty_abbr', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && abbrError) || editErrors.faculty_abbr ? 'border-red-600 bg-red-50' : ''}`}
                            maxLength={10}
                          />
                          {((showErrors && abbrError) || editErrors.faculty_abbr) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập mã khoa</p>
                          )}
                        </>
                      ) : (
                        <span className={abbrError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {faculty.faculty_abbr || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={faculty.name || ''}
                            onChange={(e) => handleFacultyChange(index, 'name', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && nameError) || editErrors.name ? 'border-red-600 bg-red-50' : ''}`}
                            maxLength={100}
                          />
                          {((showErrors && nameError) || editErrors.name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên khoa</p>
                          )}
                        </>
                      ) : (
                        <span className={nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {faculty.name || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
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
                              >
                                <SquarePen size={20} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="text-red-600 hover:text-red-800 flex items-center space-x-1"
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
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              Import Khoa
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 