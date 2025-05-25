"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Trash, RefreshCw, Plus, SquarePen, Download } from "lucide-react";
import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { Tooltip } from 'antd';
import Loading from "@/components/Loading";

export default function DepartmentOfficerImport({
  onOfficersImported,
  setLoadingManager
}: {
  onOfficersImported: (officers: any[]) => Promise<{ success: boolean }>;
  setLoadingManager: (value: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOfficers, setPreviewOfficers] = useState<any[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalOfficerBeforeEdit, setOriginalOfficerBeforeEdit] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (email: string) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string | null) => {
    if (!phone) return true; // Phone is optional
    return /^\d{10}$/.test(phone);
  };

  const validateOfficer = (officer: any) => {
    return {
      usernameError: !officer.username || officer.username.trim() === '',
      officer_nameError: !officer.officer_name || officer.officer_name.trim() === '',
      emailError: !isValidEmail(officer.email),
      phoneError: !isValidPhone(officer.officer_phone)
    };
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    const officers: any[] = [];

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
        toast.error('File Excel không có dữ liệu cán bộ khoa. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const username = row.getCell(1).value?.toString().trim() || '';
        const officer_name = row.getCell(2).value?.toString().trim() || '';
        const email = row.getCell(3)?.value?.toString().trim() || '';
        const officer_phone = row.getCell(4)?.value?.toString().trim() || null;

        if (!username && !officer_name && !email) {
          return; // Skip completely empty rows
        }

        officers.push({
          username,
          officer_name,
          email,
          officer_phone,
          row_number: rowNumber
        });
      });

      if (officers.length === 0) {
        toast.error('Không tìm thấy dữ liệu cán bộ khoa hợp lệ trong file.');
        setLoading(false);
        return;
      }

      setPreviewOfficers(officers);
      setShowErrors(false);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(`Đã tải lên ${officers.length} cán bộ khoa từ file Excel.`);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Lỗi khi đọc file Excel. Hãy đảm bảo file không bị hỏng và đúng định dạng .xlsx.');
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
    setPreviewOfficers(prev => [
      ...prev,
      {
        username: '',
        officer_name: '',
        email: '',
        officer_phone: null,
        row_number: prev.length > 0 ? Math.max(...prev.map(s => s.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewOfficers.length);
    setEditErrors({});
  };

  const handleOfficerChange = (index: number, key: string, value: string) => {
    setPreviewOfficers(prev => {
      const updated = [...prev];
      updated[index][key] = value;
      return updated;
    });
    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewOfficers(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditRow = (index: number) => {
    setOriginalOfficerBeforeEdit(JSON.parse(JSON.stringify(previewOfficers[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && originalOfficerBeforeEdit) {
      setPreviewOfficers(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalOfficerBeforeEdit;
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalOfficerBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const officer = previewOfficers[editingIndex];
    const { 
      usernameError, 
      officer_nameError, 
      emailError,
      phoneError
    } = validateOfficer(officer);

    if (usernameError || officer_nameError || emailError || phoneError) {
      setEditErrors({
        username: usernameError,
        officer_name: officer_nameError,
        email: emailError,
        officer_phone: phoneError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalOfficerBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidOfficers = previewOfficers.filter(officer => {
      const { 
        usernameError, 
        officer_nameError, 
        emailError,
        phoneError
      } = validateOfficer(officer);
      
      return usernameError || officer_nameError || emailError || phoneError;
    });

    if (invalidOfficers.length > 0) {
      toast.error(`Có ${invalidOfficers.length} cán bộ khoa chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      return;
    }

    if (previewOfficers.length === 0) {
      toast.error("Không có dữ liệu để import.");
      return;
    }

    setImporting(true);
    setLoadingManager(true);
    
    try {
      const result = await onOfficersImported(previewOfficers);

      if (result.success) {
        toast.success(`Import thành công cán bộ khoa!`);
        setPreviewOfficers([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
      } else {
        toast.error("Import thất bại. Vui lòng kiểm tra lại dữ liệu.");
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi import cán bộ khoa');
    } finally {
      setImporting(false);
      setLoadingManager(false);
    }
  };

  const downloadSampleTemplate = () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Import_department_officers');

    // Add headers
    sheet.columns = [
      { header: 'Tên đăng nhập (*)', key: 'username', width: 20 },
      { header: 'Tên cán bộ khoa (*)', key: 'officer_name', width: 30 },
      { header: 'Email (*)', key: 'email', width: 30 },
      { header: 'Số điện thoại', key: 'officer_phone', width: 20 }
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF000000' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };
    });

    // Add some sample data
    sheet.addRow({
      username: 'officer1',
      officer_name: 'Nguyễn Văn A',
      email: 'officer1@example.com',
      officer_phone: '0123456789'
    });
    
    sheet.addRow({
      username: 'officer2',
      officer_name: 'Trần Thị B',
      email: 'officer2@example.com',
      officer_phone: '0987654321'
    });

    // Write to buffer and download
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'department_officers_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Tải xuống mẫu thành công!');
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import cán bộ khoa từ file Excel</p>
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
            <span>{previewOfficers.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
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

      {previewOfficers.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Xem trước & chỉnh sửa Cán bộ khoa</h3>
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
              <li><strong>Tên đăng nhập (*):</strong> Tên tài khoản của cán bộ khoa (bắt buộc)</li>
              <li><strong>Tên cán bộ khoa (*):</strong> Tên đầy đủ của cán bộ khoa (bắt buộc)</li>
              <li><strong>Email (*):</strong> Địa chỉ email hợp lệ của cán bộ khoa (bắt buộc)</li>
              <li><strong>Số điện thoại:</strong> Số điện thoại 10 chữ số của cán bộ khoa (không bắt buộc)</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đăng nhập (*)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên cán bộ khoa (*)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email (*)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewOfficers.map((officer, index) => {
                const { 
                  usernameError, 
                  officer_nameError, 
                  emailError,
                  phoneError
                } = validateOfficer(officer);
                const hasError = usernameError || officer_nameError || emailError || phoneError;
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-6 py-4 ${showErrors && usernameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={officer.username || ""}
                            onChange={(e) => handleOfficerChange(index, "username", e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && usernameError) || editErrors.username ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && usernameError) || editErrors.username) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên đăng nhập</p>
                          )}
                        </>
                      ) : (
                        <span className={usernameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {officer.username || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${showErrors && officer_nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={officer.officer_name || ""}
                            onChange={(e) => handleOfficerChange(index, "officer_name", e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && officer_nameError) || editErrors.officer_name ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && officer_nameError) || editErrors.officer_name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên cán bộ khoa</p>
                          )}
                        </>
                      ) : (
                        <span className={officer_nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {officer.officer_name || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${showErrors && emailError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={officer.email || ""}
                            onChange={(e) => handleOfficerChange(index, "email", e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && emailError) || editErrors.email ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && emailError) || editErrors.email) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Email không hợp lệ</p>
                          )}
                        </>
                      ) : (
                        <span className={emailError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {officer.email || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${showErrors && phoneError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={officer.officer_phone || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d{0,10}$/.test(value)) {
                                handleOfficerChange(index, "officer_phone", value);
                              }
                            }}
                            maxLength={10}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && phoneError) || editErrors.officer_phone ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && phoneError) || editErrors.officer_phone) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Số điện thoại phải có 10 chữ số</p>
                          )}
                        </>
                      ) : (
                        <span className={phoneError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {officer.officer_phone || "-"}
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
              {importing ? "Đang import..." : "Import Cán bộ khoa"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 