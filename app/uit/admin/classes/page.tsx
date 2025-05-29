'use client';

import { useState, useMemo, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Class } from '@/types/class';
import ClassTable from '@/components/Table/ClassTable';
import ClassForm from '@/components/form/ClassForm';
import ClassImport from '@/components/Import/ClassImport';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Loading from '@/components/Loading';
import debounce from 'lodash.debounce';
import { useData } from '@/lib/contexts/DataContext';

export default function ClassManagementPage() {
  const { classes: contextClasses, loading: dataLoading, refreshData } = useData();
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [classIdToDelete, setClassIdToDelete] = useState<number | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'import'>('list');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    setClasses(contextClasses.map(cls => ({
      ...cls,
      cohort: String(cls.cohort)
    })));
  }, [contextClasses]);

  const handleCreateClass = async (data: Partial<Class>) => {
    setSubmitLoading(true);
    try {
      await api.post('/api/classes', {
        name: data.name,
        faculty_id: data.faculty_id,
        cohort: data.cohort
      });
      toast.success('Thêm lớp thành công!');
      setMode('list');
      refreshData(); // Refresh data in context
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Lỗi khi tạo lớp';
      toast.error(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateClass = async (classItem: Class) => {
    try {
      await api.put(`/api/classes/${classItem.id}`, {
        name: classItem.name,
        faculty_id: classItem.faculty_id,
        cohort: classItem.cohort
      });
      toast.success('Cập nhật lớp thành công!');
      refreshData(); // Refresh data in context
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Lỗi khi cập nhật lớp';
      toast.error(errorMessage);
      return Promise.reject(error);
    }
  };

  const handleDeleteClick = (id: number) => {
    setClassIdToDelete(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!classIdToDelete) return;

    try {
      await api.delete(`/api/classes/${classIdToDelete}`);
      toast.success('Xóa lớp thành công!');
      refreshData(); // Refresh data in context
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Lỗi khi xóa lớp';
      toast.error(errorMessage);
    } finally {
      setShowConfirmModal(false);
      setClassIdToDelete(null);
    }
  };

  const handleImportClasses = async (importedClasses: Partial<Class>[]) => {
    try {
      await api.post('/api/classes/import', importedClasses);
      toast.success('Import lớp thành công!');
      setMode('list');
      refreshData(); // Refresh data in context
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Lỗi khi import lớp';
      toast.error(errorMessage);
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

  const filteredClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cohort.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.Faculty?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classes, searchTerm]);

  const renderContent = () => {
    if (mode === 'create') {
      return (
        <ClassForm
          onSubmit={handleCreateClass}
          setLoading={setSubmitLoading}
        />
      );
    } else if (mode === 'import') {
      return (
        <ClassImport
          onClassesImported={handleImportClasses}
          setLoadingManager={setSubmitLoading}
        />
      );
    } else {
      return (
        <ClassTable
          classes={filteredClasses}
          onEditClass={handleUpdateClass}
          onDeleteClass={handleDeleteClick}
        />
      );
    }
  };

  if (dataLoading || submitLoading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý lớp</h1>

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {mode === 'list' ? (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm lớp..."
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
          />
          <div className="flex gap-4">
            <button
              onClick={() => setMode('create')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm lớp mới
            </button>
            <button
              onClick={() => setMode('import')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import lớp
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setMode('list');
            }}
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