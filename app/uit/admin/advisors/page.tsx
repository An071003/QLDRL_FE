'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import debounce from 'lodash.debounce';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Advisor } from '@/types/advisor';
import AdvisorTable from '@/components/Table/AdvisorTable';
import AdvisorForm from '@/components/form/AdvisorForm';
import AdvisorImport from '@/components/Import/AdvisorImport';
import { useData } from '@/lib/contexts/DataContext';

interface AdvisorCreateData {
  name: string;
  faculty_id: number;
  phone: string | null;
  user: {
    email: string | null;
    username: string | null;
  };
}

interface AdvisorImportData {
  username: string;
  name: string;
  faculty_id: number | null;
  email: string;
  phone: string | null;
  row_number: number;
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

export default function AdvisorManagementPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [advisorIdToDelete, setAdvisorIdToDelete] = useState<number | null>(null);
  const [editingAdvisorId, setEditingAdvisorId] = useState<number | null>(null);
  const [activeComponent, setActiveComponent] = useState<'form' | 'import' | 'table'>('table');
  const { faculties, loading: dataLoading } = useData();
  
  // Edit state for inline editing
  const [editData, setEditData] = useState<{
    name: string;
    faculty_id: string;
    phone: string;
  }>({
    name: '',
    faculty_id: '',
    phone: '',
  });

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const fetchAdvisors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/advisors');
      if (res.data.advisors) {
        setAdvisors(res.data.advisors);
      } else {
        setAdvisors([]);
      }
    } catch (error) {
      console.error('Failed to fetch advisors:', error);
      toast.error('Không thể tải danh sách cố vấn học tập');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdvisor = async (advisorData: AdvisorCreateData) => {
    try {
      await api.post('/api/advisors', advisorData);
      toast.success('Thêm cố vấn học tập thành công!');
      fetchAdvisors();
      setActiveComponent('table');
      return Promise.resolve();
    } catch (error: unknown) {
      const err = error as ApiError;
      const msg = err?.message || 'Lỗi khi thêm cố vấn học tập';
      toast.error(msg);
      return Promise.reject(error);
    }
  };

  const handleEditClick = (advisor: Advisor) => {
    setEditingAdvisorId(advisor.id);
    setEditData({
      name: advisor.name || '',
      faculty_id: advisor.faculty_id?.toString() || '',
      phone: advisor.phone || '',
    });
  };

  const handleSaveEdit = async (id: number) => {
    setLoading(true);
    try {
      await api.put(`/api/advisors/${id}`, {
        name: editData.name,
        faculty_id: editData.faculty_id ? parseInt(editData.faculty_id) : null,
        phone: editData.phone || null,
      });
      
      toast.success('Cập nhật cố vấn học tập thành công!');
      fetchAdvisors();
      setEditingAdvisorId(null);
    } catch (err) {
      console.error('Failed to update advisor:', err);
      toast.error('Lỗi khi cập nhật cố vấn học tập');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAdvisorId(null);
  };

  const handleDeleteClick = (advisorId: number) => {
    setAdvisorIdToDelete(advisorId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!advisorIdToDelete) return;
    
    setLoading(true);
    try {
      await api.delete(`/api/advisors/${advisorIdToDelete}`);
      toast.success('Xóa cố vấn học tập thành công');
      fetchAdvisors();
    } catch (err) {
      console.error('Failed to delete advisor:', err);
      toast.error('Lỗi khi xóa cố vấn học tập');
    } finally {
      setShowConfirmModal(false);
      setAdvisorIdToDelete(null);
      setLoading(false);
    }
  };

  const handleImportAdvisors = async (advisors: AdvisorImportData[]): Promise<{ success: boolean }> => {
    try {
      const res = await api.post<ImportResponse>('/api/advisors/import', { advisors });
      
      if (res.data.status === 'success' || res.data.status === 'partial') {
        const successMessage = res.data.status === 'success' 
          ? 'Tất cả cố vấn đã được import thành công!' 
          : res.data.message;
        
        toast.success(successMessage);
        fetchAdvisors();
        return { success: true };
      } else {
        toast.error(res.data.message || 'Lỗi khi import cố vấn');
        return { success: false };
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMsg = apiError?.response?.data?.message || 'Lỗi khi import cố vấn học tập';
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

  const filteredAdvisors = useMemo(() => {
    return advisors.filter(
      (advisor) =>
        (advisor.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (advisor.Faculty?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (advisor.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (advisor.User?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (advisor.User?.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [advisors, searchTerm]);

  if (loading || dataLoading) return <Loading />;

  const renderComponent = () => {
    switch (activeComponent) {
      case 'form':
        return (
          <AdvisorForm 
            onAdvisorCreated={handleCreateAdvisor} 
            setLoading={setLoading} 
          />
        );
      case 'import':
        return (
          <AdvisorImport
            onAdvisorsImported={handleImportAdvisors}
            setLoadingManager={setLoading}
          />
        );
      default:
        return (
          <AdvisorTable
            advisors={filteredAdvisors}
            faculties={faculties}
            editingAdvisorId={editingAdvisorId}
            editData={editData}
            onDeleteAdvisor={handleDeleteClick}
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
      <h1 className="text-3xl font-bold mb-6">Quản lý cố vấn học tập</h1>

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {activeComponent === 'table' ? (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm cố vấn học tập..."
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
          />
          <div className="flex gap-4">
            <button
              onClick={() => setActiveComponent('form')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm cố vấn học tập
            </button>
            <button
              onClick={() => setActiveComponent('import')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import cố vấn
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