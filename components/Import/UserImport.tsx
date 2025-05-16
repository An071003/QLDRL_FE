"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Trash2, Check, X, RefreshCw, Plus, SquarePen, Download } from "lucide-react";
import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { Tooltip } from 'antd';
import { useData } from '@/lib/contexts/DataContext';

export default function UserImport({
  onUsersImported,
  setLoadingManager,
  roles
}: {
  onUsersImported: (users: any[]) => Promise<{ success: boolean }>;
  setLoadingManager: (value: boolean) => void;
  roles: { id: number; name: string }[];
}) {
  const { faculties, classes, getFilteredClasses } = useData();
  
  const [loading, setLoading] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalUserBeforeEdit, setOriginalUserBeforeEdit] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (email: string) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateUser = (user: any) => {
    return {
      emailError: !isValidEmail(user.email),
      roleError: !user.role || !roles.some(r => r.name === user.role),
      nameError: !user.user_name || user.user_name.trim() === '',
      facultyIdError: user.role === 'student' && !user.faculty_id,
      classIdError: user.role === 'student' && !user.class_id
    };
  };

  const processExcelFile = async (file: File) => {
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
        const facultyAbbr = row.getCell(4)?.value?.toString().trim() || '';
        const className = row.getCell(5)?.value?.toString().trim() || '';

        const matchedRole = roles.find(r => r.name.toLowerCase() === rawRole);
        const roleName = matchedRole ? matchedRole.name : '';
        const roleId = matchedRole?.id || null;

        // Find faculty by abbreviation
        const faculty = faculties.find(f => f.faculty_abbr.toLowerCase() === facultyAbbr.toLowerCase());
        const faculty_id = faculty?.id || null;

        // Find class by name and faculty_id
        const classMatch = classes.find(c => 
          c.name.toLowerCase() === className.toLowerCase() && 
          (!faculty_id || c.faculty_id === faculty_id)
        );
        const class_id = classMatch?.id || null;

        users.push({
          user_name: name,
          email,
          role: roleName,
          role_id: roleId,
          faculty_id,
          class_id,
          faculty_name: faculty?.name || '',
          class_name: classMatch?.name || '',
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
    setPreviewUsers(prev => [
      ...prev,
      {
        user_name: '',
        email: '',
        role: '',
        role_id: null,
        faculty_id: null,
        class_id: null,
        row_number: prev.length > 0 ? Math.max(...prev.map(u => u.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewUsers.length);
    setEditErrors({});
  };

  const handleUserChange = (index: number, key: string, value: string) => {
    setPreviewUsers(prev => {
      const updated = [...prev];
      
      // Convert faculty_id and class_id to numbers when storing
      if (key === 'faculty_id' || key === 'class_id') {
        updated[index][key] = value ? Number(value) : null;
      } else {
        updated[index][key] = value;
      }

      if (key === 'role') {
        const matched = roles.find(r => r.name === value);
        updated[index].role_id = matched?.id || null;
      }

      // Handle class filtering based on faculty
      if (key === 'faculty_id') {
        updated[index].class_id = null; // Reset class when faculty changes
      }

      return updated;
    });
    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewUsers(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditRow = (index: number) => {
    setOriginalUserBeforeEdit(JSON.parse(JSON.stringify(previewUsers[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
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
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const user = previewUsers[editingIndex];
    const { emailError, roleError, nameError, facultyIdError, classIdError } = validateUser(user);

    if (emailError || roleError || nameError || 
        (user.role === 'student' && (facultyIdError || classIdError))) {
      setEditErrors({
        email: emailError,
        role: roleError,
        user_name: nameError,
        faculty_id: facultyIdError,
        class_id: classIdError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalUserBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidUsers = previewUsers.filter(user => {
      const { emailError, roleError, nameError, facultyIdError, classIdError } = validateUser(user);
      return emailError || roleError || nameError || 
             (user.role === 'student' && (facultyIdError || classIdError));
    });

    if (invalidUsers.length > 0) {
      toast.error(`Có ${invalidUsers.length} người dùng chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      setLoadingManager(false);
      return;
    }

    setLoadingManager(true);
    const usersToImport = previewUsers.map(({ user_name, email, role_id, faculty_id, class_id }) => ({
      user_name,
      email,
      role_id,
      faculty_id,
      class_id
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
  };

  const renderEmail = (email: any, isError: boolean) => {
    if (!email || typeof email !== 'string' || isError) {
      return "-";
    }
    return email;
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    advisor: 'bg-green-100 text-green-800',
    departmentofficer: 'bg-orange-100 text-orange-800',
    student: 'bg-blue-100 text-blue-800',
  };

  // Function to generate and download a sample Excel template
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('User Import Template');
      
      // Add headers
      worksheet.columns = [
        { header: 'Họ và tên', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Vai trò', key: 'role', width: 15 },
        { header: 'Mã khoa (nếu là sinh viên)', key: 'faculty_abbr', width: 25 },
        { header: 'Tên lớp (nếu là sinh viên)', key: 'class_name', width: 25 },
      ];
      
      // Add some sample data - 1 sample for each role type
      worksheet.addRow({
        name: 'Nguyễn Văn Admin',
        email: 'admin@example.com',
        role: 'admin',
        faculty_abbr: '',
        class_name: '',
      });
      
      worksheet.addRow({
        name: 'Trần Thị Advisor',
        email: 'advisor@example.com',
        role: 'advisor',
        faculty_abbr: '',
        class_name: '',
      });

      worksheet.addRow({
        name: 'Lê Văn Officer',
        email: 'officer@example.com',
        role: 'departmentofficer',
        faculty_abbr: '',
        class_name: '',
      });
      
      worksheet.addRow({
        name: 'Phạm Thị Sinh Viên',
        email: 'student@example.com',
        role: 'student',
        faculty_abbr: 'CNTT', // Ví dụ: CNTT - Công nghệ thông tin
        class_name: 'CNTT01', // Ví dụ: CNTT01
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
              <li><strong>Vai trò:</strong> Phải là một trong các giá trị: admin, advisor, departmentofficer, student</li>
              <li><strong>Mã khoa:</strong> Bắt buộc đối với sinh viên. Phải khớp với mã khoa trong hệ thống</li>
              <li><strong>Tên lớp:</strong> Bắt buộc đối với sinh viên. Phải khớp với tên lớp trong hệ thống</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewUsers.map((user, index) => {
                const { emailError, roleError, nameError, facultyIdError, classIdError } = validateUser(user);
                const isEditing = editingIndex === index;
                const isStudent = user.role === 'student';

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
                    <td className={`px-6 py-4 whitespace-nowrap ${isStudent && showErrors && facultyIdError ? 'bg-red-100' : ''}`}>
                      {isEditing && isStudent ? (
                        <>
                          <select
                            value={user.faculty_id || ""}
                            onChange={(e) => handleUserChange(index, 'faculty_id', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${isStudent && ((showErrors && facultyIdError) || editErrors.faculty_id) ? 'border-red-600 bg-red-50' : ''}`}
                          >
                            <option value="">-- Chọn khoa --</option>
                            {faculties.map((faculty) => (
                              <option key={faculty.id} value={faculty.id}>
                                {faculty.name} ({faculty.faculty_abbr})
                              </option>
                            ))}
                          </select>
                          {isStudent && ((showErrors && facultyIdError) || editErrors.faculty_id) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng chọn khoa</p>
                          )}
                        </>
                      ) : (
                        isStudent ? (
                          <span className={facultyIdError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                            {faculties.find(f => f.id === user.faculty_id)?.faculty_abbr || "-"}
                          </span>
                        ) : "-"
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${isStudent && showErrors && classIdError ? 'bg-red-100' : ''}`}>
                      {isEditing && isStudent ? (
                        <>
                          <select
                            name="class_id"
                            value={user.class_id || ""}
                            onChange={(e) => handleUserChange(index, 'class_id', e.target.value)}
                            disabled={!user.faculty_id}
                            className={`w-full border rounded px-2 py-1 ${isStudent && ((showErrors && classIdError) || editErrors.class_id) ? 'border-red-600 bg-red-50' : ''}`}
                          >
                            <option value="">-- Chọn lớp --</option>
                            {getFilteredClasses(Number(user.faculty_id)).map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                          {isStudent && ((showErrors && classIdError) || editErrors.class_id) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng chọn lớp</p>
                          )}
                        </>
                      ) : (
                        isStudent ? (
                          <span className={classIdError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                            {classes.find(c => c.id === user.class_id)?.name || "-"}
                          </span>
                        ) : "-"
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
                              >
                                <SquarePen size={20} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="text-red-600 hover:text-red-800 flex items-center space-x-1"
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
}
