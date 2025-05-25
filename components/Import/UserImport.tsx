"use client";

import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { UploadCloud, Trash, Check, X, RefreshCw, Plus, SquarePen, Download } from "lucide-react";
import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { Tooltip } from 'antd';

const UserImport = memo(function UserImport({
  onUsersImported,
  setLoadingManager,
  roles
}: {
  onUsersImported: (users: any[]) => Promise<{ success: boolean }>;
  setLoadingManager: (value: boolean) => void;
  roles: { id: number; name: string }[];
}) {
  
  const [loading, setLoading] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalUserBeforeEdit, setOriginalUserBeforeEdit] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = useCallback((email: string) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const validateUser = useCallback((user: any) => {
    return {
      emailError: !isValidEmail(user.email),
      roleError: !user.role || !roles.some(r => r.name === user.role),
      nameError: !user.user_name || user.user_name.trim() === '',
    };
  }, [isValidEmail, roles]);

  const processExcelFile = useCallback(async (file: File) => {
    if (!file) return;

    setLoading(true);
    const users: any[] = [];

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
        toast.error('File Excel không có dữ liệu người dùng. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const name = row.getCell(1).value?.toString().trim() || '';
        const email = row.getCell(2).value?.toString().trim() || '';
        const rawRole = row.getCell(3).value?.toString().trim().toLowerCase() || '';

        const matchedRole = roles.find(r => r.name.toLowerCase() === rawRole);
        const roleName = matchedRole ? matchedRole.name : '';
        const roleId = matchedRole?.id || null;

        users.push({
          user_name: name,
          email,
          role: roleName,
          role_id: roleId,
          row_number: rowNumber
        });
      });

      if (users.length === 0) {
        toast.error('Không tìm thấy dữ liệu người dùng hợp lệ trong file.');
        setLoading(false);
        return;
      }

      setPreviewUsers(users);
      setShowErrors(false);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(`Đã tải lên ${users.length} người dùng từ file Excel.`);
    } catch (err) {
      console.error('Error reading file:', err);
      toast.error('Lỗi khi đọc file Excel. Hãy đảm bảo file không bị hỏng và đúng định dạng .xlsx.');
    } finally {
      setLoading(false);
    }
  }, [roles]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processExcelFile(file);
    resetFileInput();
  }, [processExcelFile]);

  const resetFileInput = useCallback(() => {
    setFileKey(Date.now().toString());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleReselect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleAddRow = useCallback(() => {
    setPreviewUsers(prev => [
      ...prev,
      {
        user_name: '',
        email: '',
        role: '',
        role_id: null,
        row_number: prev.length > 0 ? Math.max(...prev.map(u => u.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewUsers.length);
    setEditErrors({});
  }, [previewUsers.length]);

  const handleUserChange = useCallback((index: number, key: string, value: string) => {
    setPreviewUsers(prev => {
      const updated = [...prev];
      
      updated[index][key] = value;

      if (key === 'role') {
        const matched = roles.find(r => r.name === value);
        updated[index].role_id = matched?.id || null;
      }

      return updated;
    });
    setEditErrors(prev => ({ ...prev, [key]: false }));
  }, [roles]);

  const handleDeleteRow = useCallback((index: number) => {
    setPreviewUsers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleEditRow = useCallback((index: number) => {
    setOriginalUserBeforeEdit(JSON.parse(JSON.stringify(previewUsers[index])));
    setEditingIndex(index);
    setEditErrors({});
  }, [previewUsers]);

  const handleCancelEdit = useCallback(() => {
    if (editingIndex !== null && originalUserBeforeEdit) {
      setPreviewUsers(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalUserBeforeEdit;
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalUserBeforeEdit(null);
  }, [editingIndex, originalUserBeforeEdit]);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;

    const user = previewUsers[editingIndex];
    const { emailError, roleError, nameError } = validateUser(user);

    if (emailError || roleError || nameError) {
      setEditErrors({
        email: emailError,
        role: roleError,
        user_name: nameError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalUserBeforeEdit(null);
  }, [editingIndex, previewUsers, validateUser]);

  const handleImport = useCallback(async () => {
    setShowErrors(true);

    const invalidUsers = previewUsers.filter(user => {
      const { emailError, roleError, nameError } = validateUser(user);
      return emailError || roleError || nameError;
    });

    if (invalidUsers.length > 0) {
      toast.error(`Có ${invalidUsers.length} người dùng chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      setLoadingManager(false);
      return;
    }

    setLoadingManager(true);
    const usersToImport = previewUsers.map(({ user_name, email, role_id }) => ({
      user_name,
      email,
      role_id
    }));

    try {
      const result = await onUsersImported(usersToImport);

      if (result.success) {
        toast.success(`Import thành công ${usersToImport.length} người dùng!`);
        setPreviewUsers([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
      } else {
        toast.error('Lỗi khi import người dùng. Vui lòng thử lại hoặc liên hệ quản trị viên.');
      }
    } catch (error) {
      console.error('Error importing users:', error);
      toast.error('Đã xảy ra lỗi khi xử lý dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
    } finally {
      setLoadingManager(false);
    }
  }, [previewUsers, validateUser, onUsersImported, resetFileInput, setLoadingManager]);

  const renderEmail = useCallback((email: any, isError: boolean) => {
    if (!email || typeof email !== 'string' || isError) {
      return "-";
    }
    return email;
  }, []);
  
  const roleColors = useMemo(() => ({
    admin: 'bg-purple-100 text-purple-800',
    advisor: 'bg-green-100 text-green-800',
    student: 'bg-blue-100 text-blue-800',
    departmentofficer: 'bg-yellow-100 text-yellow-800',
    classleader: 'bg-red-100 text-red-800',
  }), []);

  // Function to generate and download a sample Excel template
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('User Import Template');
      
      // Add headers
      worksheet.columns = [
        { header: 'Tên tài khoản', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Vai trò', key: 'role', width: 15 },
      ];
      
      // Add some sample data - 1 sample for each role type
      worksheet.addRow({
        name: 'NguyenVanAdmin',
        email: 'admin@example.com',
        role: 'admin',
      });
      
      worksheet.addRow({
        name: 'TranThiAdvisor',
        email: 'advisor@example.com',
        role: 'advisor',
      });

      worksheet.addRow({
        name: 'LeVanOfficer',
        email: 'officer@example.com',
        role: 'departmentofficer',
      });
      
      worksheet.addRow({
        name: '21521001',
        email: 'student@example.com',
        role: 'student',
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
      a.download = 'user_import_template.xlsx';
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
        <p className="text-gray-600 font-medium mb-2">Import users from Excel</p>
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
            <span>{previewUsers.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
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

      {previewUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Preview</h3>
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
              <li><strong>Email:</strong> Phải là email hợp lệ (vd: example@example.com)</li>
              <li><strong>Vai trò:</strong> Phải là một trong các giá trị: admin, advisor, departmentofficer, student, class_leader</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewUsers.map((user, index) => {
                const { emailError, roleError, nameError } = validateUser(user);
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className={`px-6 py-4 whitespace-nowrap `}>{index + 1}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={user.user_name || ''}
                            onChange={(e) => handleUserChange(index, 'user_name', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && nameError) || editErrors.user_name ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && nameError) || editErrors.user_name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên người dùng</p>
                          )}
                        </>
                      ) : (
                        <span className={nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>{user.user_name || "-"}</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && emailError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={user.email || ''}
                            onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && emailError) || editErrors.email ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && emailError) || editErrors.email) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Email không đúng định dạng</p>
                          )}
                        </>
                      ) : (
                        <span className={emailError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {renderEmail(user.email, emailError)}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${showErrors && roleError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <select
                            value={user.role || ""}
                            onChange={(e) => handleUserChange(index, 'role', e.target.value)}
                            className={`w-auto border rounded px-2 py-1 ${(showErrors && roleError) || editErrors.role ? 'border-red-600 bg-red-50' : ''}`}
                          >
                            <option value="" disabled>-- Chọn vai trò --</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.name}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                          {((showErrors && roleError) || editErrors.role) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng chọn vai trò từ danh sách</p>
                          )}
                        </>
                      ) : (
                        <span className={roleError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {user.role ? (
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {user.role}
                            </span>
                          ) : "-"}
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
              Import Người Dùng
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default UserImport;
