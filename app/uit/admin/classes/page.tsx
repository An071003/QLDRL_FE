'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Class } from '@/types/class';
import ClassTable from '@/components/Table/ClassTable';
import ClassForm from '@/components/form/ClassForm';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Loading from '@/components/Loading';
import debounce from 'lodash.debounce';

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [classIdToDelete, setClassIdToDelete] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data.data.classes || []);
    } catch (err) {
      toast.error('Không thể tải danh sách lớp');
    } finally {
      setLoading(false);
    }
  };

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
      fetchClasses();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi khi tạo lớp';
      toast.error(msg);
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
      fetchClasses();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi khi cập nhật lớp';
      toast.error(msg);
      return Promise.reject(err);
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
      fetchClasses();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi khi xóa lớp';
      toast.error(msg);
    } finally {
      setShowConfirmModal(false);
      setClassIdToDelete(null);
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

  if (loading) return <Loading />;

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
          <button
            onClick={() => setMode('create')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Thêm lớp mới
          </button>
        </div>
      ) : (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setMode('list');
              setSelectedClass(null);
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