'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function StudentForm({
  onStudentCreated,
  setLoading
}: {
  onStudentCreated: (student: any) => Promise<void>;
  setLoading: (value: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    email: '',
    phone: '',
    birthdate: '',
    faculty_id: '',
    class_id: '',
  });
  
  const [faculties, setFaculties] = useState<Array<{id: number, faculty_abbr: string, name: string}>>([]);
  const [classes, setClasses] = useState<Array<{id: number, name: string, faculty_id: number}>>([]);
  const [filteredClasses, setFilteredClasses] = useState<Array<{id: number, name: string, faculty_id: number}>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facultiesRes, classesRes] = await Promise.all([
          api.get('/api/faculties'),
          api.get('/api/classes')
        ]);
        setFaculties(facultiesRes.data.data.faculties);
        setClasses(classesRes.data.data.classes);
      } catch (err) {
        toast.error('Không thể tải dữ liệu');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.faculty_id) {
      const filtered = classes.filter(c => c.faculty_id === parseInt(formData.faculty_id));
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [formData.faculty_id, classes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate student_id
    if (!formData.student_id.trim()) {
      toast.error("Vui lòng nhập mã số sinh viên");
      return;
    }
    
    // Validate email format
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email không đúng định dạng");
      return;
    }
    
    // Validate faculty and class
    if (!formData.faculty_id || !formData.class_id) {
      toast.error("Vui lòng chọn khoa và lớp");
      return;
    }
    
    // Validate phone (10 digits) if provided
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error("Số điện thoại không hợp lệ (phải có 10 chữ số)");
      return;
    }
    
    // Validate birthdate if provided
    if (formData.birthdate && isNaN(Date.parse(formData.birthdate))) {
      toast.error("Ngày sinh không hợp lệ");
      return;
    }
    
    // Prepare data for API call
    const studentData = {
      student_id: formData.student_id,
      student_name: formData.student_name,
      email: formData.email,
      phone: formData.phone || null,
      birthdate: formData.birthdate || null,
      faculty_id: parseInt(formData.faculty_id),
      class_id: parseInt(formData.class_id),
    };
    
    setLoading(true);
    await onStudentCreated(studentData);
    setFormData({
      student_id: '',
      student_name: '',
      email: '',
      phone: '',
      birthdate: '',
      faculty_id: '',
      class_id: '',
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold">Thêm sinh viên mới</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="student_id"
          value={formData.student_id}
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
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="px-3 py-2 border rounded w-full"
        />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d{0,10}$/.test(value)) {
              setFormData({ ...formData, phone: value });
            }
          }}
          placeholder="Số điện thoại (10 số)"
          className="px-3 py-2 border rounded w-full"
        />
        <input
          type="date"
          name="birthdate"
          value={formData.birthdate}
          onChange={handleChange}
          placeholder="Ngày sinh"
          className="px-3 py-2 border rounded w-full"
        />
        <select
          name="faculty_id"
          value={formData.faculty_id}
          onChange={handleChange}
          required
          className="px-3 py-2 border rounded w-full"
        >
          <option value="">Chọn khoa</option>
          {faculties.map(faculty => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name} ({faculty.faculty_abbr})
            </option>
          ))}
        </select>
        <select
          name="class_id"
          value={formData.class_id}
          onChange={handleChange}
          required
          className="px-3 py-2 border rounded w-full"
          disabled={!formData.faculty_id}
        >
          <option value="">Chọn lớp</option>
          {filteredClasses.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
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
