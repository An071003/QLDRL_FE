'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import LecturerStudentTable from '@/components/LecturerStudentTable';
import StudentActivityModal from '@/components/StudentActivityModal';
import Loading from '@/components/Loading';
import debounce from 'lodash.debounce';

export default function LecturerStudentManagementPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/students');
      setStudents(res.data.data.students);
    } catch (err) {
      toast.error('Không thể tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Sinh viên trong hệ thống</h1>

      <StudentActivityModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />

      <div className="flex justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Tìm theo mã sinh viên hoặc tên..."
          onChange={handleSearchChange}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
        />
      </div>

      <LecturerStudentTable
        students={filteredStudents}
      />
    </div>
  );
}
