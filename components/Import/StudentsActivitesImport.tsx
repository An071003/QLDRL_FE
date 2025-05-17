"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { UploadCloud, Download, Trash2, Check, X, RefreshCw, Plus, SquarePen } from "lucide-react";
import Loading from "../Loading";
import { Tooltip } from "antd";

type StudentImport = {
  mssv: string;
  error?: string;
  row_number?: number;
};

interface Props {
  onImport: (students: { mssv: string }[]) => Promise<{ success: boolean }>;
}

export default function StudentActivitiesImport({ onImport }: Props) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewStudents, setPreviewStudents] = useState<StudentImport[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalStudentBeforeEdit, setOriginalStudentBeforeEdit] = useState<StudentImport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateStudent = (student: StudentImport) => {
    let mssvError = false;
    
    // MSSV must be 8 digits
    if (!student.mssv || student.mssv.trim() === '') {
      mssvError = true;
    } else if (student.mssv.length !== 8 || !/^\d+$/.test(student.mssv)) {
      mssvError = true;
    }
    
    return { mssvError };
  };

  const checkForDuplicates = (students: StudentImport[]) => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    
    students.forEach(student => {
      if (student.mssv && student.mssv.trim() !== '') {
        if (seen.has(student.mssv)) {
          duplicates.add(student.mssv);
        } else {
          seen.add(student.mssv);
        }
      }
    });
    
    // Mark duplicates with errors
    if (duplicates.size > 0) {
      students.forEach(student => {
        if (duplicates.has(student.mssv) && !student.error) {
          student.error = "MSSV bị trùng lặp";
        }
      });
    }
    
    return students;
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    const students: StudentImport[] = [];

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
        toast.error('File Excel không có dữ liệu sinh viên. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

      // Check if this is a multi-column format (with headers)
      const firstRow = worksheet.getRow(1);
      const firstCellValue = firstRow.getCell(1).value;
      const hasHeaders = firstCellValue && 
                       (String(firstCellValue).toLowerCase().includes('mssv') || 
                        String(firstCellValue).toLowerCase().includes('mã số'));

      let mssvColumn = 1;
      
      // If we have headers, try to find the MSSV column
      if (hasHeaders) {
        for (let i = 1; i <= worksheet.columnCount; i++) {
          const headerValue = worksheet.getRow(1).getCell(i).value;
          if (headerValue && 
              (String(headerValue).toLowerCase().includes('mssv') || 
               String(headerValue).toLowerCase().includes('mã số'))) {
            mssvColumn = i;
            break;
          }
        }
      }

      const startRow = hasHeaders ? 2 : 1;
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < startRow) return;
        
        const cell = row.getCell(mssvColumn).value;
        if (!cell) return;
        
        const mssv = typeof cell === "number" ? cell.toString() : String(cell).trim();
        
        if (mssv) {
          students.push({ 
            mssv, 
            row_number: rowNumber 
          });
        }
      });

      if (students.length === 0) {
        toast.error('Không tìm thấy dữ liệu sinh viên hợp lệ trong file.');
        setLoading(false);
        return;
      }

      // Validate and check for duplicates
      const validatedStudents = checkForDuplicates(students);
      
      setPreviewStudents(validatedStudents);
      setShowErrors(false);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(`Đã tải lên ${students.length} sinh viên từ file Excel.`);
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
    setPreviewStudents(prev => [
      ...prev,
      {
        mssv: '',
        row_number: prev.length > 0 ? Math.max(...prev.map(s => s.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewStudents.length);
    setEditErrors({});
  };

  const handleStudentChange = (index: number, value: string) => {
    setPreviewStudents(prev => {
      const updated = [...prev];
      updated[index].mssv = value;
      
      // Clear existing error
      updated[index].error = undefined;
      
      // Revalidate entire list for duplicates
      return checkForDuplicates(updated);
    });
    
    setEditErrors(prev => ({ ...prev, mssv: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewStudents(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return checkForDuplicates(updated);
    });
  };

  const handleEditRow = (index: number) => {
    setOriginalStudentBeforeEdit(JSON.parse(JSON.stringify(previewStudents[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && originalStudentBeforeEdit) {
      setPreviewStudents(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalStudentBeforeEdit;
        return checkForDuplicates(updated);
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalStudentBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const student = previewStudents[editingIndex];
    const { mssvError } = validateStudent(student);

    if (mssvError) {
      setEditErrors({ mssv: mssvError });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalStudentBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidStudents = previewStudents.filter(student => {
      const { mssvError } = validateStudent(student);
      return mssvError || student.error;
    });

    if (invalidStudents.length > 0) {
      toast.error(`Có ${invalidStudents.length} sinh viên chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      return;
    }

    if (previewStudents.length === 0) {
      toast.error("Không có dữ liệu để import");
      return;
    }

    setImporting(true);
    try {
      const result = await onImport(previewStudents.map(s => ({ mssv: s.mssv })));
      if (result.success) {
        setPreviewStudents([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
        toast.success("Import sinh viên thành công!");
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
      const worksheet = workbook.addWorksheet('Sinh Viên Template');
      
      // Add headers
      worksheet.columns = [
        { header: 'MSSV', key: 'mssv', width: 15 },
        { header: 'Ghi chú', key: 'note', width: 30 },
      ];
      
      // Add some sample data
      worksheet.addRow({
        mssv: '21520000',
        note: 'Mẫu - Xóa dòng này và thêm sinh viên thật',
      });
      
      worksheet.addRow({
        mssv: '21520001',
        note: 'Mẫu - Mã số sinh viên phải là 8 chữ số',
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
      a.download = 'sinh_vien_import_template.xlsx';
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
        <p className="text-gray-600 font-medium mb-2">Import sinh viên từ file Excel</p>
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
            <span>{previewStudents.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
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

      {previewStudents.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Xem trước danh sách sinh viên</h3>
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
              <li><strong>MSSV:</strong> Mã số sinh viên phải là 8 chữ số (ví dụ: 21520001)</li>
              <li>Mỗi MSSV chỉ được import một lần, không được trùng lặp</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewStudents.map((student, index) => {
                const { mssvError } = validateStudent(student);
                const hasDuplicateError = student.error?.includes("trùng lặp");
                const hasError = mssvError || hasDuplicateError;
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && hasError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={student.mssv || ''}
                            onChange={(e) => handleStudentChange(index, e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && hasError) || editErrors.mssv ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && mssvError) || editErrors.mssv) && (
                            <p className="text-xs text-red-600 font-medium mt-1">MSSV phải là 8 chữ số</p>
                          )}
                          {showErrors && hasDuplicateError && (
                            <p className="text-xs text-red-600 font-medium mt-1">{student.error}</p>
                          )}
                        </>
                      ) : (
                        <span className={hasError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {student.mssv || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasError ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {hasDuplicateError ? "MSSV trùng lặp" : "MSSV không hợp lệ"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Hợp lệ
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
              {importing ? "Đang import..." : "Import Sinh viên"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
