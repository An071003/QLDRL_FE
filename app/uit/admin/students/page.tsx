'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import StudentTable from '@/components/Table/StudentTable';
import StudentForm from '@/components/form/StudentForm';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Loading from '@/components/Loading';
import debounce from 'lodash.debounce';
import StudentImport from '@/components/StudentImport';

export default function StudentManagementPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentIdToDelete, setStudentIdToDelete] = useState<string | null>(null);
  const [activeComponent, setActiveComponent] = useState<'table' | 'form' | 'import'>('table');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/students');
      setStudents(res.data.data.students);
    } catch (err) {
      toast.error('Không thể tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (newStudent: any) => {
    try {
      await api.post('/api/students', newStudent);
      toast.success('Thêm sinh viên thành công!');
      fetchStudents();
      setActiveComponent('table');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi khi tạo sinh viên';
      toast.error(msg);
    }
  };

  const handleDeleteClick = (studentId: string) => {
    setStudentIdToDelete(studentId);
    setShowConfirmModal(true);
  };

  const handleUpdateStudent = async (id: string, updatedData: any) => {
    try {
      await api.put(`/api/students/${id}`, updatedData);
      toast.success("Cập nhật sinh viên thành công");
      fetchStudents();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleConfirmDelete = async () => {
    if (!studentIdToDelete) return;
    try {
      await api.delete(`/api/students/${studentIdToDelete}`);
      toast.success('Xóa sinh viên thành công');
      fetchStudents();
    } catch {
      toast.error('Lỗi khi xóa sinh viên');
    } finally {
      setShowConfirmModal(false);
      setStudentIdToDelete(null);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleStudentsImported = async (importedStudents: any[]): Promise<{ success: boolean }> => {
    try {
      setLoading(true);
      const res = await api.post('/api/students/import', { students: importedStudents });
      toast.success(`Đã import ${res.data.createdCount || importedStudents.length} sinh viên thành công!`);
      fetchStudents();
      setActiveComponent('table');
      return { success: true };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi khi import sinh viên';
      toast.error(msg);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'form':
        return <StudentForm onStudentCreated={handleCreateStudent} setLoading={setLoading} />
      case 'import':
        return <StudentImport onStudentsImported={handleStudentsImported} setLoadingManager={setLoading} />
      default:
        return <StudentTable
          students={filteredStudents}
          onDeleteStudent={handleDeleteClick}
          onUpdateStudent={handleUpdateStudent}
        />
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý sinh viên</h1>

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {activeComponent === 'table' ? (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm theo mã sinh viên hoặc tên..."
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
          />
          <div className="flex gap-4">
            <button
              onClick={() => setActiveComponent('form')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm sinh viên
            </button>
            <button
              onClick={() => setActiveComponent('import')}
              className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import sinh viên
            </button>
          </div>
        </div>
      ) : (
        <div className='flex justify-end mb-6'>
          <button
            onClick={() => setActiveComponent('table')}
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay về danh sách
          </button>
        </div>)}
      <div className="mb-6">{renderComponent()}</div>
    </div>
  );
}
