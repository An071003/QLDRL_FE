import { useState } from 'react';
import { toast } from 'sonner';

interface DepartmentOfficer {
  officer_name: string;
  officer_phone: string | null;
  username: string;
  email: string;
}

interface DepartmentOfficerFormProps {
  onOfficerCreated: (officer: DepartmentOfficer) => Promise<void>;
  setLoading: (loading: boolean) => void;
  onCancel?: () => void;
}

export default function DepartmentOfficerForm({ onOfficerCreated, setLoading, onCancel }: DepartmentOfficerFormProps) {
  const [formData, setFormData] = useState<{
    officer_name: string;
    officer_phone: string;
    email: string;
    username: string;
  }>({
    officer_name: '',
    officer_phone: '',
    email: '',
    username: '',
  });

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.officer_name.trim()) {
      toast.error('Vui lòng nhập tên cán bộ khoa');
      return;
    }

    if (!formData.username.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    if (formData.officer_phone && !validatePhone(formData.officer_phone)) {
      toast.error('Số điện thoại phải có 10 chữ số');
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const officerData: DepartmentOfficer = {
        officer_name: formData.officer_name,
        officer_phone: formData.officer_phone || null,
        username: formData.username,
        email: formData.email
      };
      
      await onOfficerCreated(officerData);
      resetForm();
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      officer_name: '',
      officer_phone: '',
      email: '',
      username: '',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Thêm cán bộ khoa mới
        </h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="officer_name" className="block text-gray-700 font-medium mb-2">
            Tên cán bộ khoa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="officer_name"
            value={formData.officer_name}
            onChange={(e) => setFormData({ ...formData, officer_name: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
            Tên đăng nhập <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên đăng nhập"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập địa chỉ email"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="officer_phone" className="block text-gray-700 font-medium mb-2">
            Số điện thoại
          </label>
          <input
            type="text"
            id="officer_phone"
            value={formData.officer_phone}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d{0,10}$/.test(value)) {
                setFormData({ ...formData, officer_phone: value });
              }
            }}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập số điện thoại (10 số)"
            maxLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">Số điện thoại phải có đúng 10 chữ số</p>
        </div>
        
        <div className="flex justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Hủy
            </button>
          )}
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