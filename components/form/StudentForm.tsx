'use client';

import { useState } from 'react';

export default function StudentForm({
  onStudentCreated,
  setLoading
}: {
  onStudentCreated: (student: any) => Promise<void>;
  setLoading: (value: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    id: '',
    student_name: '',
    faculty: '',
    course: '',
    class: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onStudentCreated(formData);
    setFormData({
      id: '',
      student_name: '',
      faculty: '',
      course: '',
      class: '',
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold">Thêm sinh viên mới</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="id"
          value={formData.id}
          onChange={handleChange}
          placeholder="Mã số sinh viên"
          required
          className="px-3 py-2 border rounded w-full"
        />
        <input
          type="text"
          name="student_name"
          value={formData.student_name}
          onChange={handleChange}
          placeholder="Họ tên sinh viên"
          required
          className="px-3 py-2 border rounded w-full"
        />
        <input
          type="text"
          name="faculty"
          value={formData.faculty}
          onChange={handleChange}
          placeholder="Khoa"
          required
          className="px-3 py-2 border rounded w-full"
        />
        <input
          type="text"
          name="course"
          value={formData.course}
          onChange={handleChange}
          placeholder="Khóa"
          required
          className="px-3 py-2 border rounded w-full"
        />
        <input
          type="text"
          name="class"
          value={formData.class}
          onChange={handleChange}
          placeholder="Lớp"
          required
          className="px-3 py-2 border rounded w-full"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Tạo sinh viên
        </button>
      </div>
    </form>
  );
}
