"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Trash, RefreshCw, Plus, SquarePen, Download } from "lucide-react";
import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { Tooltip } from 'antd';
import { useData } from '@/lib/contexts/DataContext';

export default function StudentImport({
  onStudentsImported,
  setLoadingManager
}: {
  onStudentsImported: (students: any[]) => Promise<{ success: boolean }>;
  setLoadingManager: (value: boolean) => void;
}) {
  const { faculties, classes, loading: dataLoading, getFilteredClasses } = useData();
  
  const [loading, setLoading] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalStudentBeforeEdit, setOriginalStudentBeforeEdit] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (email: string) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string | null) => {
    if (!phone) return true; 
    return /^\d{10}$/.test(phone);
  };

  const isValidDate = (date: string | null) => {
    if (!date) return true;
    return !isNaN(Date.parse(date));
  };

  const validateStudent = (student: any) => {
    return {
      studentIdError: !student.student_id || student.student_id.trim() === '',
      nameError: !student.student_name || student.student_name.trim() === '',
      facultyIdError: !student.faculty_id,
      classIdError: !student.class_id,
      emailError: !isValidEmail(student.email),
      phoneError: !isValidPhone(student.phone),
      birthdateError: !isValidDate(student.birthdate)
    };
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    const students: any[] = [];

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

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const student_id = row.getCell(1).value?.toString().trim() || '';
        const student_name = row.getCell(2).value?.toString().trim() || '';
        const facultyAbbr = row.getCell(3).value?.toString().trim() || '';
        const className = row.getCell(4).value?.toString().trim() || '';
        const email = row.getCell(5)?.value?.toString().trim() || '';
        const phone = row.getCell(6)?.value?.toString().trim() || null;
        const birthdate = row.getCell(7)?.value || null;

        const faculty = faculties.find(f => f.faculty_abbr.toLowerCase() === facultyAbbr.toLowerCase());
        const faculty_id = faculty?.id || null;

        const classMatch = classes.find(c => 
          c.name.toLowerCase() === className.toLowerCase() && 
          (!faculty_id || c.faculty_id === faculty_id)
        );
        const class_id = classMatch?.id || null;

          students.push({
            student_id,
            student_name,
            faculty_id,
            class_id,
            email,
            phone,
            birthdate: birthdate,
            row_number: rowNumber
          });
      });

      if (students.length === 0) {
        toast.error('Không tìm thấy dữ liệu sinh viên hợp lệ trong file.');
        setLoading(false);
        return;
      }

      setPreviewStudents(students);
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
        student_id: '',
        student_name: '',
        faculty_id: null,
        class_id: null,
        email: '',
        phone: null,
        birthdate: null,
        row_number: prev.length > 0 ? Math.max(...prev.map(s => s.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewStudents.length);
    setEditErrors({});
  };

  const handleStudentChange = (index: number, key: string, value: string) => {
    setPreviewStudents(prev => {
      const updated = [...prev];

      if (key === 'faculty_id' || key === 'class_id') {
        updated[index][key] = value ? Number(value) : null;
      } else {
        updated[index][key] = value;
      }

      if (key === 'faculty_id') {
        updated[index].class_id = null;
      }

      return updated;
    });
    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewStudents(prev => prev.filter((_, i) => i !== index));
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
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalStudentBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const student = previewStudents[editingIndex];
    const { 
      studentIdError, 
      nameError, 
      facultyIdError, 
      classIdError, 
      emailError,
      phoneError,
      birthdateError
    } = validateStudent(student);

    if (studentIdError || nameError || facultyIdError || classIdError || emailError || phoneError || birthdateError) {
      setEditErrors({
        student_id: studentIdError,
        student_name: nameError,
        faculty_id: facultyIdError,
        class_id: classIdError,
        email: emailError,
        phone: phoneError,
        birthdate: birthdateError
      });
      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalStudentBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidStudents = previewStudents.filter(student => {
      const { 
        studentIdError, 
        nameError, 
        facultyIdError, 
        classIdError, 
        emailError,
        phoneError,
        birthdateError
      } = validateStudent(student);
      return studentIdError || nameError || facultyIdError || classIdError || 
             emailError || phoneError || birthdateError;
    });

    if (invalidStudents.length > 0) {
      toast.error(`Có ${invalidStudents.length} sinh viên chứa lỗi. Vui lòng kiểm tra các ô màu đỏ và sửa trước khi import.`);
      return;
    }

    setLoadingManager(true);
    
    try {
      const result = await onStudentsImported(previewStudents);

      if (result.success) {
        toast.success(`Import thành công sinh viên!`);
        setPreviewStudents([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
      } else {
        toast.error('Lỗi khi import sinh viên. Vui lòng thử lại hoặc liên hệ quản trị viên.');
      }
    } catch (error) {
      console.error('Error importing students:', error);
      toast.error('Đã xảy ra lỗi khi xử lý dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
    } finally {
      setLoadingManager(false);
    }
  };

  // Function to generate and download a sample Excel template
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Student Import Template');
      
      // Add headers
      worksheet.columns = [
        { header: 'MSSV', key: 'student_id', width: 15 },
        { header: 'Họ và tên', key: 'student_name', width: 30 },
        { header: 'Mã khoa', key: 'faculty_abbr', width: 15 },
        { header: 'Tên lớp', key: 'class_name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Ngày sinh (DD/MM/YYYY)', key: 'birthdate', width: 25 },
      ];
      
      // Add some sample data
      worksheet.addRow({
        student_id: '20050001',
        student_name: 'Nguyễn Văn A',
        faculty_abbr: 'MMT',
        class_name: 'CNTT01',
        email: 'nguyenvana@example.com',
        phone: '0123456789',
        birthdate: new Date(2000, 0, 1).toLocaleDateString(),
      });
      
      worksheet.addRow({
        student_id: '20050002',
        student_name: 'Trần Thị B',
        faculty_abbr: 'KH-KTT',
        class_name: 'CNCL2021',
        email: 'tranthib@example.com',
        phone: '0987654321',
        birthdate: new Date(2000, 5, 15).toLocaleDateString(),
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
      a.download = 'student_import_template.xlsx';
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
        <p className="mt-4 text-gray-600">Đang tải dữ liệu khoa và lớp...</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import sinh viên từ Excel</p>
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
              <li><strong>MSSV:</strong> Mã số sinh viên, không được để trống</li>
              <li><strong>Họ và tên:</strong> Tên đầy đủ của sinh viên, không được để trống</li>
              <li><strong>Mã khoa:</strong> Phải khớp với mã khoa trong hệ thống</li>
              <li><strong>Tên lớp:</strong> Phải khớp với tên lớp trong hệ thống</li>
              <li><strong>Email:</strong> Phải là email hợp lệ (vd: example@example.com)</li>
              <li><strong>Số điện thoại:</strong> Chuỗi 10 số (tùy chọn)</li>
              <li><strong>Ngày sinh:</strong> Định dạng ngày DD/MM/YYYY (tùy chọn)</li>
            </ul>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MSSV</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Khoa</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày sinh</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewStudents.map((student, index) => {
                const { 
                  studentIdError, 
                  nameError, 
                  facultyIdError, 
                  classIdError, 
                  emailError,
                  phoneError,
                  birthdateError
                } = validateStudent(student);
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && studentIdError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={student.student_id || ''}
                            onChange={(e) => handleStudentChange(index, 'student_id', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && studentIdError) || editErrors.student_id ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && studentIdError) || editErrors.student_id) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập MSSV</p>
                          )}
                        </>
                      ) : (
                        <span className={studentIdError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>{student.student_id || "-"}</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={student.student_name || ''}
                            onChange={(e) => handleStudentChange(index, 'student_name', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && nameError) || editErrors.student_name ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && nameError) || editErrors.student_name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên sinh viên</p>
                          )}
                        </>
                      ) : (
                        <span className={nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>{student.student_name || "-"}</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && facultyIdError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <select
                            value={student.faculty_id || ""}
                            onChange={(e) => handleStudentChange(index, 'faculty_id', e.target.value)}
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
                          {faculties.find(f => f.id === student.faculty_id)?.faculty_abbr || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && classIdError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <select
                            value={student.class_id || ""}
                            onChange={(e) => handleStudentChange(index, 'class_id', e.target.value)}
                            disabled={!student.faculty_id}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && classIdError) || editErrors.class_id ? 'border-red-600 bg-red-50' : ''}`}
                          >
                            <option value="">-- Chọn lớp --</option>
                            {getFilteredClasses(Number(student.faculty_id)).map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                          {((showErrors && classIdError) || editErrors.class_id) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng chọn lớp</p>
                          )}
                        </>
                      ) : (
                        <span className={classIdError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {classes.find(c => c.id === student.class_id)?.name || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && emailError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={student.email || ''}
                            onChange={(e) => handleStudentChange(index, 'email', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && emailError) || editErrors.email ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && emailError) || editErrors.email) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Email không hợp lệ</p>
                          )}
                        </>
                      ) : (
                        <span className={emailError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {student.email || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && phoneError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={student.phone || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,10}$/.test(value)) {
                                handleStudentChange(index, 'phone', value);
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
                          {student.phone || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${showErrors && birthdateError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="date"
                            value={student.birthdate ? new Date(student.birthdate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleStudentChange(index, 'birthdate', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && birthdateError) || editErrors.birthdate ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && birthdateError) || editErrors.birthdate) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Ngày không hợp lệ</p>
                          )}
                        </>
                      ) : (
                        <span className={birthdateError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {student.birthdate ? new Date(student.birthdate).toLocaleDateString() : "-"}
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
                                <SquarePen size={16} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="text-red-600 hover:text-red-800"
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
              Tạo Sinh Viên
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
