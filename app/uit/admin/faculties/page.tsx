'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Faculty } from '@/types/faculty';
import FacultyTable from '@/components/Table/FacultyTable';
import FacultyForm from '@/components/form/FacultyForm';
import FacultyImport from '@/components/Import/FacultyImport';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Loading from '@/components/Loading';
import debounce from 'lodash.debounce';
import { useData } from '@/lib/contexts/DataContext';

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function FacultyManagementPage() {
  const { faculties: contextFaculties, loading: dataLoading, refreshData } = useData();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [facultyIdToDelete, setFacultyIdToDelete] = useState<number | null>(null);

  const [mode, setMode] = useState<'list' | 'create' | 'import'>('list');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    setFaculties(contextFaculties);
  }, [contextFaculties]);

  const handleCreateFaculty = async (data: Partial<Faculty>) => {
    try {
      await api.post('/api/faculties', {
        faculty_abbr: data.faculty_abbr,
        name: data.name
      });
      toast.success('Thêm khoa thành công!');
      setMode('list');
      refreshData(); // Refresh data in context
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      const msg = err?.response?.data?.message || 'Lỗi khi tạo khoa';
      toast.error(msg);
    }
  };

  const handleUpdateFaculty = async (faculty: Faculty) => {
    try {
      await api.put(`/api/faculties/${faculty.id}`, {
        faculty_abbr: faculty.faculty_abbr,
        name: faculty.name
      });
      toast.success('Cập nhật khoa thành công!');
      refreshData(); // Refresh data in context
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      const msg = err?.response?.data?.message || 'Lỗi khi cập nhật khoa';
      toast.error(msg);
      return Promise.reject(err);
    }
  };

  const handleDeleteClick = (id: number) => {
    setFacultyIdToDelete(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!facultyIdToDelete) return;
    try {
      await api.delete(`/api/faculties/${facultyIdToDelete}`);
      toast.success('Xóa khoa thành công!');
      refreshData(); // Refresh data in context
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      const msg = err?.response?.data?.message || 'Lỗi khi xóa khoa';
      toast.error(msg);
    } finally {
      setShowConfirmModal(false);
      setFacultyIdToDelete(null);
    }
  };

  const handleImportFaculties = async (importedFaculties: Partial<Faculty>[]) => {
    try {
      // The backend API needs to be implemented for this
      await api.post('/api/faculties/import', importedFaculties);
      toast.success('Import khoa thành công!');
      setMode('list');
      refreshData(); // Refresh data in context
      return { success: true };
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      const msg = err?.response?.data?.message || 'Lỗi khi import khoa';
      toast.error(msg);
      return { success: false };
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredFaculties = useMemo(() => {
    return faculties.filter(
      (f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.faculty_abbr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [faculties, searchTerm]);



  const renderContent = () => {
    if (mode === 'create') {
      return (
        <FacultyForm 
          onSubmit={handleCreateFaculty}
          setLoading={setSubmitLoading}
        />
      );
    } else if (mode === 'import') {
      return (
        <FacultyImport 
          onFacultiesImported={handleImportFaculties}
          setLoadingManager={setSubmitLoading}
        />
      );
    } else {
      return (
        <FacultyTable 
          faculties={filteredFaculties}
          onEditFaculty={handleUpdateFaculty}
          onDeleteFaculty={handleDeleteClick}
        />
      );
    }
  };

  if (dataLoading || submitLoading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý khoa</h1>

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {mode === 'list' ? (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm khoa..."
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
          />
          <div className="flex gap-4">
            <button
              onClick={() => setMode('create')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm khoa mới
            </button>
            <button
              onClick={() => setMode('import')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import khoa
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setMode('list')}
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay lại danh sách
          </button>
        </div>
      )}

      <div className="mb-6">
        {renderContent()}
      </div>
    </div>
  );
}
