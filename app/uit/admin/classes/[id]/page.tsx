'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import { Class } from '@/types/class';
import { Student } from '@/types/student';
import { Advisor } from '@/types/advisor';
import { Faculty } from '@/types/faculty';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string;

  // State for data
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [facultyAdvisors, setFacultyAdvisors] = useState<Advisor[]>([]);
  
  // State for form and editing
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    faculty_id: '',
    cohort: '',
    class_leader_id: '',
    advisor_id: '',
  });

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  useEffect(() => {
    if (classData?.faculty_id) {
      fetchFacultyAdvisors(classData.faculty_id);
    }
  }, [classData?.faculty_id]);

  const fetchClassDetails = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      // Fetch class details with students
      const classRes = await api.get(`/api/classes/${classId}/details`);
      if (classRes.data?.data) {
        const classDetail = classRes.data.data;
        
        // Fetch basic class data which includes faculty info
        const basicClassRes = await api.get(`/api/classes/${classId}`);
        if (basicClassRes.data?.data?.class) {
          const basicClassData = basicClassRes.data.data.class;
          setClassData(basicClassData);
          setFormData({
            name: basicClassData.name || '',
            faculty_id: basicClassData.faculty_id?.toString() || '',
            cohort: basicClassData.cohort || '',
            class_leader_id: basicClassData.class_leader_id || '',
            advisor_id: basicClassData.advisor_id?.toString() || '',
          });

          if (basicClassData.Faculty) {
            setFaculty(basicClassData.Faculty);
          }
        }
        
        setStudents(classDetail.students || []);
        setAdvisor(classDetail.advisor || null);
      } else {
        toast.error('Không tìm thấy thông tin lớp');
        setClassData(null);
      }
    } catch (err) {
      console.error('Failed to fetch class details:', err);
      toast.error('Không thể tải thông tin lớp');
      setClassData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyAdvisors = async (facultyId: number) => {
    try {
      const res = await api.get(`/api/advisors?faculty_id=${facultyId}`);
      if (res.data.advisors) {
        setFacultyAdvisors(res.data.advisors);
      } else {
        setFacultyAdvisors([]);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách cố vấn học tập của khoa');
      setFacultyAdvisors([]);
    }
  };

  const handleSaveChanges = async () => {
    if (!classData) return;
    
    // Validate form data
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên lớp');
      return;
    }
    
    setSaving(true);
    try {
      // Convert to appropriate types
      const updateData = {
        name: formData.name,
        faculty_id: parseInt(formData.faculty_id),
        cohort: formData.cohort,
        class_leader_id: formData.class_leader_id || null,
        advisor_id: formData.advisor_id ? parseInt(formData.advisor_id) : null,
      };
      
      await api.put(`/api/classes/${classId}`, updateData);
      toast.success('Cập nhật thông tin lớp thành công');
      setEditing(false);
      fetchClassDetails(); // Refresh data
    } catch (err) {
      console.error('Failed to update class:', err);
      toast.error('Cập nhật thông tin lớp thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  if (!classData) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin lớp</h1>
        <button
          className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={() => router.push('/uit/admin/classes')}
        >
          Quay về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thông tin lớp</h1>
      
      <div className="flex justify-end gap-4 mb-6">
        {editing ? (
          <>
            <button
              className="px-4 py-2 cursor-pointer bg-green-500 text-white rounded hover:bg-green-700"
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              className="px-4 py-2 cursor-pointer bg-gray-400 text-white rounded hover:bg-gray-600"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Hủy
            </button>
          </>
        ) : (
          <button
            className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-700"
            onClick={() => setEditing(true)}
          >
            Chỉnh sửa
          </button>
        )}
        <button
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          onClick={() => router.push('/uit/admin/classes')}
        >
          Quay về danh sách
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 mb-1">Tên lớp</p>
            {editing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="font-medium">{classData.name || 'Chưa có tên'}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 mb-1">Khoa</p>
            <p className="font-medium">{faculty?.name || 'Chưa có thông tin'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Khóa</p>
            {editing ? (
              <input
                type="text"
                value={formData.cohort}
                onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="font-medium">{classData.cohort || 'Chưa có thông tin'}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 mb-1">Cố vấn học tập</p>
            {editing ? (
              <select
                value={formData.advisor_id}
                onChange={(e) => setFormData({ ...formData, advisor_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn cố vấn --</option>
                {facultyAdvisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>
                    {advisor.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-medium">{advisor?.name || 'Chưa có cố vấn'}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 mb-1">Lớp trưởng</p>
            {editing ? (
              <select
                value={formData.class_leader_id}
                onChange={(e) => setFormData({ ...formData, class_leader_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn lớp trưởng --</option>
                {students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.student_name} ({student.student_id})
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-medium">
                {students.find(s => s.student_id === classData.class_leader_id)?.student_name || 'Chưa có lớp trưởng'}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Danh sách sinh viên</h2>
        
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.student_id} className={`hover:bg-gray-50 ${student.student_id === classData.class_leader_id ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.student_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.student_name}
                      {student.student_id === classData.class_leader_id && (
                        <span className="ml-2 text-xs text-white bg-blue-500 px-2 py-1 rounded">Lớp trưởng</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.birthdate ? new Date(student.birthdate).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.status === 'disciplined' ? (
                        <span className="text-red-600">Kỷ luật</span>
                      ) : (
                        <span className="text-green-600">Bình thường</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-4 bg-gray-50 text-gray-500">
            Lớp này chưa có sinh viên nào.
          </div>
        )}
      </div>
    </div>
  );
} 