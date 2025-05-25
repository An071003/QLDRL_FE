"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Trash, RefreshCw, Plus, SquarePen, Download } from "lucide-react";
import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { Tooltip } from 'antd';
import { useData } from '@/lib/contexts/DataContext';

export default function AdvisorImport({
  onAdvisorsImported,
  setLoadingManager
}: {
  onAdvisorsImported: (advisors: any[]) => Promise<{ success: boolean }>;
  setLoadingManager: (value: boolean) => void;
}) {
  const { faculties, loading: dataLoading } = useData();
  
  const [loading, setLoading] = useState(false);
  const [previewAdvisors, setPreviewAdvisors] = useState<any[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalAdvisorBeforeEdit, setOriginalAdvisorBeforeEdit] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (email: string) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string | null) => {
    if (!phone) return true; // Phone is optional
    return /^\d{10}$/.test(phone);
  };

  const validateAdvisor = (advisor: any) => {
    return {
      usernameError: !advisor.username || advisor.username.trim() === '',
      nameError: !advisor.name || advisor.name.trim() === '',
      facultyIdError: !advisor.faculty_id,
      emailError: !isValidEmail(advisor.email),
      phoneError: !isValidPhone(advisor.phone)
    };
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    const advisors: any[] = [];

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
        toast.error('File Excel không có dữ liệu cố vấn. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const name = row.getCell(1).value?.toString().trim() || '';
        const username = row.getCell(2).value?.toString().trim() || '';
        const facultyAbbr = row.getCell(3).value?.toString().trim() || '';
        const email = row.getCell(4)?.value?.toString().trim() || '';
        const phone = row.getCell(5)?.value?.toString().trim() || null;

        const faculty = faculties.find(f => f.faculty_abbr.toLowerCase() === facultyAbbr.toLowerCase());
        const faculty_id = faculty?.id || null;

        advisors.push({
          username,
          name,
          faculty_id,
          email,
          phone,
          row_number: rowNumber
        });
      });

      if (advisors.length === 0) {
        toast.error('Không tìm thấy dữ liệu cố vấn hợp lệ trong file.');
        setLoading(false);
        return;
      }

      setPreviewAdvisors(advisors);
      setShowErrors(false);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(`Đã tải lên ${advisors.length} cố vấn từ file Excel.`);
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
    setPreviewAdvisors(prev => [
      ...prev,
      {
        username: '',
        name: '',
        faculty_id: null,
        email: '',
        phone: null,
        row_number: prev.length > 0 ? Math.max(...prev.map(s => s.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewAdvisors.length);
    setEditErrors({});
  };

  const handleAdvisorChange = (index: number, key: string, value: string) => {
    setPreviewAdvisors(prev => {
      const updated = [...prev];
      
      // Convert faculty_id to number when storing
      if (key === 'faculty_id') {
        updated[index][key] = value ? Number(value) : null;
      } else {
        updated[index][key] = value;
      }

      return updated;
    });
    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewAdvisors(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditRow = (index: number) => {
    setOriginalAdvisorBeforeEdit(JSON.parse(JSON.stringify(previewAdvisors[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && originalAdvisorBeforeEdit) {
      setPreviewAdvisors(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalAdvisorBeforeEdit;
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalAdvisorBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const advisor = previewAdvisors[editingIndex];
    const { 
      usernameError, 
      nameError, 
      facultyIdError, 
      emailError,
      phoneError
    } = validateAdvisor(advisor);

    if (usernameError || nameError || facultyIdError || emailError || phoneError) {
      setEditErrors({
        username: usernameError,
        name: nameError,
        faculty_id: facultyIdError,
        email: emailError,
        phone: phoneError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalAdvisorBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidAdvisors = previewAdvisors.filter(advisor => {
      const { 
        usernameError, 
        nameError, 
        facultyIdError, 
        emailError,
        phoneError
      } = validateAdvisor(advisor);
      
      return usernameError || nameError || facultyIdError || emailError || phoneError;
    });

    if (invalidAdvisors.length > 0) {
      toast.error(`Có ${invalidAdvisors.length} cố vấn chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      return;
    }

    setLoadingManager(true);
    
    try {
      const result = await onAdvisorsImported(previewAdvisors);

      if (result.success) {
        toast.success(`Import thành công cố vấn!`);
        setPreviewAdvisors([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
      } else {
        toast.error('Lỗi khi import cố vấn. Vui lòng thử lại hoặc liên hệ quản trị viên.');
      }
    } catch (error) {
      console.error('Error importing advisors:', error);
      toast.error('Đã xảy ra lỗi khi xử lý dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
    } finally {
      setLoadingManager(false);
    }
  };

  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Advisor Import Template');

      worksheet.columns = [
        { header: 'Họ và tên', key: 'name', width: 30 },
        { header: 'Tên đăng nhập', key: 'username', width: 20 },
        { header: 'Mã khoa', key: 'faculty_abbr', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
      ];
      
      worksheet.addRow({
        name: 'Nguyễn Văn A',
        username: 'cvht001',
        faculty_abbr: 'KH-KTTT',
        email: 'nguyenvana@example.com',
        phone: '0123456789',
      });
      
      worksheet.addRow({
        name: 'Trần Thị B',
        username: 'cvht002',
        faculty_abbr: 'MMT',
        email: 'tranthib@example.com',
        phone: '0987654321',
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
      a.download = 'advisor_import_template.xlsx';
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
        <p className="text-gray-600 font-medium mb-2">Import cố vấn học tập từ Excel</p>
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
            <span>{previewAdvisors.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
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

      {previewAdvisors.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Xem trước danh sách cố vấn học tập</h3>
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
              <li><strong>Tên đăng nhập:</strong> Tên đăng nhập cho cố vấn, không được để trống</li>
              <li><strong>Họ và tên:</strong> Tên đầy đủ của cố vấn, không được để trống</li>
              <li><strong>Mã khoa:</strong> Phải khớp với mã khoa trong hệ thống</li>
              <li><strong>Email:</strong> Phải là email hợp lệ (vd: example@example.com)</li>
              <li><strong>Số điện thoại:</strong> Chuỗi 10 số (tùy chọn)</li>
            </ul>
            <p className="mt-2 text-blue-700 font-medium">* Hệ thống sẽ tự động tạo mật khẩu và gửi email thông báo cho cố vấn.</p>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên đăng nhập</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Khoa</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewAdvisors.map((advisor, index) => {
                const { 
                  usernameError, 
                  nameError, 
                  facultyIdError, 
                  emailError,
                  phoneError
                } = validateAdvisor(advisor);
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={advisor.name || ''}
                            onChange={(e) => handleAdvisorChange(index, 'name', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && nameError) || editErrors.name ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && nameError) || editErrors.name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên cố vấn</p>
                          )}
                        </>
                      ) : (
                        <span className={nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>{advisor.name || "-"}</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && usernameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={advisor.username || ''}
                            onChange={(e) => handleAdvisorChange(index, 'username', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && usernameError) || editErrors.username ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && usernameError) || editErrors.username) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên đăng nhập</p>
                          )}
                        </>
                      ) : (
                        <span className={usernameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>{advisor.username || "-"}</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && facultyIdError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <select
                            value={advisor.faculty_id || ""}
                            onChange={(e) => handleAdvisorChange(index, 'faculty_id', e.target.value)}
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
                          {faculties.find(f => f.id === advisor.faculty_id)?.faculty_abbr || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && emailError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={advisor.email || ''}
                            onChange={(e) => handleAdvisorChange(index, 'email', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && emailError) || editErrors.email ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && emailError) || editErrors.email) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Email không hợp lệ</p>
                          )}
                        </>
                      ) : (
                        <span className={emailError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {advisor.email || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && phoneError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={advisor.phone || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,10}$/.test(value)) {
                                handleAdvisorChange(index, 'phone', value);
                              }
                            }}
                            placeholder="10 số"
                            className={`w-full border rounded px-2 py-1 ${(showErrors && phoneError) || editErrors.phone ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && phoneError) || editErrors.phone) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Cần đủ 10 số</p>
                          )}
                        </>
                      ) : (
                        <span className={phoneError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {advisor.phone || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap flex justify-center">
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
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <SquarePen size={20} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash size={20} />
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
              Tạo Cố Vấn
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 