'use client';

import { useState, useEffect } from 'react';
import { Class } from '@/types/class';
import { Faculty } from '@/types/faculty';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  classItem?: Class;
  onSubmit: (data: Partial<Class>) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export default function ClassForm({ classItem, onSubmit, setLoading }: Props) {
  const [name, setName] = useState('');
  const [facultyId, setFacultyId] = useState<number | ''>('');
  const [cohort, setCohort] = useState('');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [error, setError] = useState('');

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/faculties');
      setFaculties(response.data.data.faculties || []);
    } catch (err) {
      toast.error('Không thể tải danh sách khoa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (classItem) {
      setName(classItem.name);
      setFacultyId(classItem.faculty_id);
      setCohort(classItem.cohort);
    }
  }, [classItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp');
      return;
    }

    if (!facultyId) {
      setError('Vui lòng chọn khoa');
      return;
    }

    if (!cohort.trim()) {
      setError('Vui lòng nhập khóa');
      return;
    }

    try {
      await onSubmit({
        id: classItem?.id,
        name,
        faculty_id: Number(facultyId),
        cohort,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {classItem ? 'Chỉnh sửa thông tin lớp' : 'Thêm lớp mới'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
            Tên lớp
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên lớp (ví dụ: MMT2022)"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="faculty">
            Khoa
          </label>
          <select
            id="faculty"
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn khoa --</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="cohort">
            Khóa
          </label>
          <input
            type="text"
            id="cohort"
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập khóa (ví dụ: 2022)"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            Thêm lớp
          </button>
        </div>
      </form>
    </div>
  );
} 