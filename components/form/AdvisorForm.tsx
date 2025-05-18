import { useState, useEffect } from 'react';
import { Faculty } from '@/types/advisor';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AdvisorFormProps {
  onAdvisorCreated: (advisor: any) => Promise<void>;
  setLoading: (loading: boolean) => void;
  onCancel?: () => void;
}

export default function AdvisorForm({ onAdvisorCreated, setLoading, onCancel }: AdvisorFormProps) {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [formData, setFormData] = useState<{
    name: string;
    user_id: string;
    faculty_id: string;
    phone: string;
  }>({
    name: '',
    user_id: '',
    faculty_id: '',
    phone: '',
  });

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const res = await api.get('/api/faculties');
      if (Array.isArray(res.data.data)) {
        setFaculties(res.data.data);
      } else if (res.data.data.faculties) {
        setFaculties(res.data.data.faculties);
      } else {
        setFaculties([]);
      }
    } catch (err) {
      console.error('Failed to fetch faculties:', err);
      toast.error('Không thể tải danh sách khoa');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên cố vấn học tập');
      return;
    }

    if (!formData.faculty_id) {
      toast.error('Vui lòng chọn khoa');
      return;
    }

    setLoading(true);
    try {
      // Convert user_id to number or null
      const userId = formData.user_id ? parseInt(formData.user_id) : null;
      const advisorData = {
        name: formData.name,
        user_id: userId,
        faculty_id: parseInt(formData.faculty_id),
        phone: formData.phone || null
      };
      
      await onAdvisorCreated(advisorData);
      resetForm();
    } catch (err: any) {
      console.error('Error in form submission:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      user_id: '',
      faculty_id: '',
      phone: '',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Thêm cố vấn học tập mới
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Hủy
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
            Tên cố vấn học tập <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="user_id" className="block text-gray-700 font-medium mb-2">
            ID Người dùng
          </label>
          <input
            type="text"
            id="user_id"
            value={formData.user_id}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                setFormData({ ...formData, user_id: value });
              }
            }}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập ID người dùng (nếu có)"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
            Số điện thoại
          </label>
          <input
            type="text"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập số điện thoại"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="faculty" className="block text-gray-700 font-medium mb-2">
            Khoa <span className="text-red-500">*</span>
          </label>
          <select
            id="faculty"
            value={formData.faculty_id}
            onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Chọn khoa --</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thêm mới
          </button>
        </div>
      </form>
    </div>
  );
} 