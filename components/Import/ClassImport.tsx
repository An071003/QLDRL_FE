"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { UploadCloud, Download, Trash, RefreshCw, Plus, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { Tooltip } from 'antd';
import { Class } from "@/types/class";
import { useData } from "@/lib/contexts/DataContext";

type ClassImportProps = {
  onClassesImported: (classes: Partial<Class>[]) => Promise<{ success: boolean }>;
  setLoadingManager: (value: boolean) => void;
};

export default function ClassImport({ onClassesImported, setLoadingManager }: ClassImportProps) {
  const { faculties, loading: dataLoading } = useData();
  
  const [loading, setLoading] = useState(false);
  const [previewClasses, setPreviewClasses] = useState<Partial<Class>[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalClassBeforeEdit, setOriginalClassBeforeEdit] = useState<Partial<Class> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateClass = (classItem: Partial<Class>) => {
    return {
      nameError: !classItem.name || classItem.name.trim() === '',
      facultyIdError: !classItem.faculty_id,
      cohortError: !classItem.cohort || classItem.cohort.trim() === ''
    };
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    const classes: Partial<Class>[] = [];

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
        toast.error('File Excel không có dữ liệu lớp. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const name = row.getCell(1).value?.toString().trim() || '';
        const facultyAbbr = row.getCell(2).value?.toString().trim() || '';
        const cohort = row.getCell(3).value?.toString().trim() || '';

        if (!name || !facultyAbbr || !cohort) {
          console.warn(`Invalid row ${rowNumber}`);
          return;
        }

        const faculty = faculties.find(f => f.faculty_abbr.toLowerCase() === facultyAbbr.toLowerCase());
        const faculty_id = faculty?.id || null;

        classes.push({
          name,
          faculty_id,
          cohort,
          row_number: rowNumber
        });
      });

      if (classes.length === 0) {
        toast.error('Không tìm thấy dữ liệu lớp hợp lệ trong file.');
        setLoading(false);
        return;
      }

      setPreviewClasses(classes);
      setShowErrors(false);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(`Đã tải lên ${classes.length} lớp từ file Excel.`);
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
    setPreviewClasses(prev => [
      ...prev,
      {
        name: '',
        faculty_id: null,
        cohort: '',
        row_number: prev.length > 0 ? Math.max(...(prev.map(c => c.row_number || 0))) + 1 : 2
      }
    ]);

    setEditingIndex(previewClasses.length);
    setEditErrors({});
  };

  const handleClassChange = (index: number, key: keyof Class, value: string | number) => {
    setPreviewClasses(prev => {
      const updated = [...prev];
      if (key === 'faculty_id') {
        updated[index] = { ...updated[index], [key]: value ? Number(value) : null };
      } else {
        updated[index] = { ...updated[index], [key]: value };
      }
      return updated;
    });
    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewClasses(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditRow = (index: number) => {
    setOriginalClassBeforeEdit(JSON.parse(JSON.stringify(previewClasses[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && originalClassBeforeEdit) {
      setPreviewClasses(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalClassBeforeEdit;
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalClassBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const classItem = previewClasses[editingIndex];
    const { nameError, facultyIdError, cohortError } = validateClass(classItem);

    if (nameError || facultyIdError || cohortError) {
      setEditErrors({
        name: nameError,
        faculty_id: facultyIdError,
        cohort: cohortError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalClassBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidClasses = previewClasses.filter(classItem => {
      const { nameError, facultyIdError, cohortError } = validateClass(classItem);
      return nameError || facultyIdError || cohortError;
    });

    if (invalidClasses.length > 0) {
      toast.error(`Có ${invalidClasses.length} lớp chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      return;
    }

    setLoadingManager(true);
    
    try {
      const result = await onClassesImported(previewClasses);

      if (result.success) {
        toast.success(`Import thành công ${previewClasses.length} lớp!`);
        setPreviewClasses([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
      } else {
        toast.error('Lỗi khi import lớp. Vui lòng thử lại hoặc liên hệ quản trị viên.');
      }
    } catch (error) {
      console.error('Error importing classes:', error);
      toast.error('Đã xảy ra lỗi khi xử lý dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
    } finally {
      setLoadingManager(false);
    }
  };

  // Function to generate and download a sample Excel template
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Class Import Template');
      
      // Add headers
      worksheet.columns = [
        { header: 'Tên lớp', key: 'name', width: 20 },
        { header: 'Mã khoa', key: 'faculty_abbr', width: 15 },
        { header: 'Khóa', key: 'cohort', width: 10 },
      ];
      
      // Add some sample data
      worksheet.addRow({
        name: 'CNTT01',
        faculty_abbr: 'CNTT',
        cohort: 'K15',
      });
      
      worksheet.addRow({
        name: 'KTPM02',
        faculty_abbr: 'KTPM',
        cohort: 'K16',
      });
      
      worksheet.addRow({
        name: 'HTTT03',
        faculty_abbr: 'HTTT',
        cohort: 'K17',
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
      a.download = 'class_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Tải xuống mẫu Excel thành công!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Có lỗi khi tạo file mẫu.');
    }
  };

  if (dataLoading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu khoa...</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import Lớp từ file Excel</p>
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
            <span>{previewClasses.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
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

      {previewClasses.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Xem trước danh sách lớp</h3>
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
              <li><strong>Tên lớp:</strong> Tên của lớp, không được để trống</li>
              <li><strong>Mã khoa:</strong> Phải khớp với mã khoa đã có trong hệ thống</li>
              <li><strong>Khóa:</strong> Năm học của lớp (VD: K15, K16, etc.), không được để trống</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên lớp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewClasses.map((classItem, index) => {
                const { nameError, facultyIdError, cohortError } = validateClass(classItem);
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={classItem.name || ''}
                            onChange={(e) => handleClassChange(index, 'name', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && nameError) || editErrors.name ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && nameError) || editErrors.name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên lớp</p>
                          )}
                        </>
                      ) : (
                        <span className={nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {classItem.name || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && facultyIdError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <select
                            value={classItem.faculty_id || ""}
                            onChange={(e) => handleClassChange(index, 'faculty_id', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && facultyIdError) || editErrors.faculty_id ? 'border-red-600 bg-red-50' : ''}`}
                          >
                            <option value="">-- Chọn khoa --</option>
                            {faculties.map((faculty) => (
                              <option key={faculty.id} value={faculty.id}>
                                {faculty.name} ({faculty.faculty_abbr})
                              </option>
                            ))}
                          </select>
                          {((showErrors && facultyIdError) || editErrors.faculty_id) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng chọn khoa</p>
                          )}
                        </>
                      ) : (
                        <span className={facultyIdError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {faculties.find(f => f.id === classItem.faculty_id)?.faculty_abbr || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && cohortError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={classItem.cohort || ''}
                            onChange={(e) => handleClassChange(index, 'cohort', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && cohortError) || editErrors.cohort ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && cohortError) || editErrors.cohort) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập khóa</p>
                          )}
                        </>
                      ) : (
                        <span className={cohortError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {classItem.cohort || "-"}
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
              Import Lớp
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 