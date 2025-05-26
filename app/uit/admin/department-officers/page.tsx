'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import debounce from 'lodash.debounce';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import DepartmentOfficerTable from '@/components/Table/DepartmentOfficerTable';
import DepartmentOfficerForm from '@/components/form/DepartmentOfficerForm';
import DepartmentOfficerImport from '@/components/Import/DepartmentOfficerImport';
import { DepartmentOfficer } from '@/types/department-officer';

interface DepartmentOfficerCreateData {
  officer_name: string;
  officer_phone: string | null;
  username: string;
  email: string;
}

interface DepartmentOfficerImportData {
  officer_name: string;
  officer_phone: string | null;
  username: string;
  email: string;
  row_number?: number;
}

interface ImportResponse {
  status: 'success' | 'partial';
  message?: string;
  data?: {
    failed?: Array<{
      row: number;
      errors: string[];
    }>;
  };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function DepartmentOfficerManagementPage() {
  const [officers, setOfficers] = useState<DepartmentOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [officerIdToDelete, setOfficerIdToDelete] = useState<number | null>(null);
  const [editingOfficerId, setEditingOfficerId] = useState<number | null>(null);
  const [activeComponent, setActiveComponent] = useState<'table' | 'form' | 'import'>('table');
  
  // Edit state for inline editing
  const [editData, setEditData] = useState<{
    officer_name: string;
    officer_phone: string;
  }>({
    officer_name: '',
    officer_phone: '',
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/department-officers');
      if (res.data.officers) {
        setOfficers(res.data.officers);
      } else {
        setOfficers([]);
      }
    } catch (err) {
      console.error('Failed to fetch department officers:', err);
      toast.error('Không thể tải danh sách cán bộ khoa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOfficer = async (officerData: DepartmentOfficerCreateData) => {
    try {
      await api.post('/api/department-officers', officerData);
      toast.success('Thêm cán bộ thành công!');
      fetchOfficers();
      setActiveComponent('table');
      return Promise.resolve();
    } catch (error) {
      const err = error as ApiError;
      const msg = err?.response?.data?.message || 'Lỗi khi thêm cán bộ';
      toast.error(msg);
      return Promise.reject(error);
    }
  };

  const handleEditClick = (officer: DepartmentOfficer) => {
    setEditingOfficerId(officer.id);
    setEditData({
      officer_name: officer.officer_name || '',
      officer_phone: officer.officer_phone || '',
    });
  };

  const handleSaveEdit = async (id: number) => {
    setLoading(true);
    try {
      await api.put(`/api/department-officers/${id}`, {
        officer_name: editData.officer_name,
        officer_phone: editData.officer_phone || null,
      });
      
      toast.success('Cập nhật cán bộ khoa thành công!');
      fetchOfficers();
      setEditingOfficerId(null);
    } catch (err) {
      console.error('Failed to update department officer:', err);
      toast.error('Lỗi khi cập nhật cán bộ khoa');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingOfficerId(null);
  };

  const handleDeleteClick = (officerId: number) => {
    setOfficerIdToDelete(officerId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!officerIdToDelete) return;
    
    setLoading(true);
    try {
      await api.delete(`/api/department-officers/${officerIdToDelete}`);
      toast.success('Xóa cán bộ khoa thành công');
      fetchOfficers();
    } catch (err) {
      console.error('Failed to delete department officer:', err);
      toast.error('Lỗi khi xóa cán bộ khoa');
    } finally {
      setShowConfirmModal(false);
      setOfficerIdToDelete(null);
      setLoading(false);
    }
  };

  const handleImportOfficers = async (officers: DepartmentOfficerImportData[]): Promise<{ success: boolean }> => {
    try {
      const res = await api.post<ImportResponse>('/api/department-officers/import', { officers });
      
      if (res.data.status === 'success' || res.data.status === 'partial') {
        const successMessage = res.data.status === 'success' 
          ? 'Tất cả cán bộ đã được import thành công!' 
          : res.data.message;
        
        toast.success(successMessage);
        fetchOfficers();
        return { success: true };
      } else {
        toast.error(res.data.message || 'Lỗi khi import cán bộ');
        return { success: false };
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMsg = apiError?.response?.data?.message || 'Lỗi khi import cán bộ';
      toast.error(errorMsg);
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

  const filteredOfficers = useMemo(() => {
    return officers.filter(
      (officer) =>
        (officer.officer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (officer.officer_phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (officer.User?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (officer.User?.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [officers, searchTerm]);

  if (loading) return <Loading />;

  const renderComponent = () => {
    switch (activeComponent) {
      case 'form':
        return (
          <DepartmentOfficerForm 
            onOfficerCreated={handleCreateOfficer} 
            setLoading={setLoading} 
            onCancel={() => setActiveComponent('table')}
          />
        );
      case 'import':
        return (
          <DepartmentOfficerImport
            onOfficersImported={handleImportOfficers}
            setLoadingManager={setLoading}
          />
        );
      default:
        return (
          <DepartmentOfficerTable
            officers={filteredOfficers}
            editingOfficerId={editingOfficerId}
            editData={editData}
            onDeleteOfficer={handleDeleteClick}
            onEditClick={handleEditClick}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onEditDataChange={setEditData}
          />
        );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý cán bộ khoa</h1>

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {activeComponent === 'table' ? (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm cán bộ khoa..."
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
          />
          <div className="flex gap-4">
            <button
              onClick={() => setActiveComponent('form')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm cán bộ khoa
            </button>
            <button
              onClick={() => setActiveComponent('import')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import cán bộ khoa
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
        </div>
      )}

      <div className="mb-6">{renderComponent()}</div>
    </div>
  );
} 