'use client';

import { useState, useEffect } from 'react';
import { Faculty } from '@/types/faculty';

interface Props {
  faculty?: Faculty;
  onSubmit: (data: Partial<Faculty>) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export default function FacultyForm({ faculty, onSubmit, setLoading }: Props) {
  const [facultyAbbr, setFacultyAbbr] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (faculty) {
      setFacultyAbbr(faculty.faculty_abbr);
      setName(faculty.name);
    }
  }, [faculty]);

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    setError('');

    if (!facultyAbbr.trim()) {
      setError('Vui lòng nhập mã khoa');
      return;
    }

    if (!name.trim()) {
      setError('Vui lòng nhập tên khoa');
      return;
    }

    try {
      await onSubmit({
        id: faculty?.id,
        faculty_abbr: facultyAbbr,
        name,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {faculty ? 'Chỉnh sửa thông tin khoa' : 'Thêm khoa mới'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="faculty_abbr">
            Mã khoa
          </label>
          <input
            type="text"
            id="faculty_abbr"
            value={facultyAbbr}
            onChange={(e) => setFacultyAbbr(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mã khoa (ví dụ: CNTT)"
            maxLength={10}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
            Tên khoa
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên đầy đủ của khoa"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {faculty ? 'Cập nhật' : 'Thêm khoa'}
          </button>
        </div>
      </form>
    </div>
  );
}
