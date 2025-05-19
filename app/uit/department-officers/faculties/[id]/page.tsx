'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import { Faculty } from '@/types/faculty';
import { Class } from '@/types/class';

export default function FacultyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facultyId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const fetchFacultyDetails = async () => {
      if (!facultyId) return;
      setLoading(true);
      try {
        // Fetch faculty details
        const facultyRes = await api.get(`/api/faculties/${facultyId}`);
        if (facultyRes.data.data.faculty) {
          setFaculty(facultyRes.data.data.faculty);
        } else {
          toast.error('Không tìm thấy thông tin khoa');
          setFaculty(null);
        }

        // Fetch classes for this faculty
        const classesRes = await api.get(`/api/faculties/${facultyId}/classes`);
        if (classesRes.data.data.classes) {
          setClasses(classesRes.data.data.classes);
        } else {
          setClasses([]);
        }
      } catch (err) {
        console.error('Failed to fetch faculty details:', err);
        toast.error('Không thể tải thông tin khoa');
        setFaculty(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacultyDetails();
  }, [facultyId]);

  if (loading) return <Loading />;

  if (!faculty) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin khoa</h1>
        <button
          className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={() => router.push('/uit/department-officers/faculties')}
        >
          Quay về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thông tin khoa</h1>
      
      <div className="flex justify-end gap-4 mb-6">
        <button
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          onClick={() => router.push('/uit/department-officers/faculties')}
        >
          Quay về danh sách
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 mb-1">Tên khoa</p>
            <p className="font-medium">{faculty.name || 'Chưa có tên'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Mã khoa</p>
            <p className="font-medium">{faculty.faculty_abbr || 'Chưa có mã'}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Danh sách lớp thuộc khoa</h2>
        
        {classes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên lớp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map((classItem, index) => (
                  <tr key={classItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{classItem.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{classItem.cohort || 'N'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-4 bg-gray-50 text-gray-500">
            Khoa này chưa có lớp nào.
          </div>
        )}
      </div>
    </div>
  );
} 