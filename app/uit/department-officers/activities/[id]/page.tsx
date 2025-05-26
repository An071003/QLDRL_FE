'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
import { Table, Tag, Input, Button, Modal, Checkbox } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import debounce from 'lodash.debounce';
import { Activity } from "@/types/activity";
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

interface StudentActivity {
  id: number;
  student_id: string;
  student_name: string;
  class?: string;
  faculty?: string;
  participated: boolean;
}

export default function DPOActivityStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Modal states for registering new students
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<StudentActivity[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");
  
  // Confirm modal for removing students
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [studentIdToDelete, setStudentIdToDelete] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch activity details
      const activityRes = await api.get(`/api/activities/${activityId}`);
      
      if (!activityRes.data || !activityRes.data.data || !activityRes.data.data.activity) {
        throw new Error('Invalid activity data response');
      }
      
      const activityData = activityRes.data.data.activity;
      console.log('Activity data:', activityData);
      
      setActivity(activityData);
      
      // Xác định nếu có thể chỉnh sửa
      if (activityData.status === 'ongoing' && activityData.approver_id !== null) {
        const currentDate = new Date();
        const registrationStart = activityData.registration_start ? new Date(activityData.registration_start) : null;
        const registrationEnd = activityData.registration_end ? new Date(activityData.registration_end) : null;
        
        if (registrationStart && registrationEnd && 
            currentDate >= registrationStart && 
            currentDate <= registrationEnd) {
          setCanEdit(true);
        }
      }

      // Only fetch students if the activity exists
      if (activityData.approver_id !== null) {
        try {
          const studentsRes = await api.get(`/api/student-activities/${activityId}`);
          setStudents(studentsRes.data.data.students || []);
        } catch (err) {
          console.error('Failed to fetch students:', err);
          // Don't fail the whole page if just student data fails
          setStudents([]);
          toast.error('Không thể tải dữ liệu sinh viên');
        }
      }
    } catch (err) {
      console.error('Failed to fetch activity data:', err);
      setError('Không thể tải dữ liệu hoạt động');
      toast.error('Không thể tải dữ liệu hoạt động');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchData();
  }, [activityId, fetchData]);

  const debouncedSearch = debounce((value: string) => {
    setSearch(value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filtered = students.filter(s => 
    s.student_id?.toLowerCase().includes(search.toLowerCase()) || 
    s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.class?.toLowerCase().includes(search.toLowerCase())
  );

  // Fix TypeScript type issue with Table columns
  const columns: ColumnsType<StudentActivity> = [
    {
      title: 'STT',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 70
    },
    {
      title: 'MSSV',
      dataIndex: 'student_id',
      key: 'student_id',
      sorter: (a, b) => (a.student_id || '').localeCompare(b.student_id || '')
    },
    {
      title: 'Tên sinh viên',
      dataIndex: 'student_name',
      key: 'student_name',
      sorter: (a, b) => (a.student_name || '').localeCompare(b.student_name || '')
    },
    {
      title: 'Lớp',
      dataIndex: 'class',
      key: 'class'
    },
    {
      title: 'Trạng thái tham gia',
      key: 'participated',
      render: (_, record) => (
        <Tag color={record.participated ? 'green' : 'gray'}>
          {record.participated ? 'Đã tham gia' : 'Chưa tham gia'}
        </Tag>
      ),
      filters: [
        { text: 'Đã tham gia', value: true },
        { text: 'Chưa tham gia', value: false }
      ],
      onFilter: (value, record) => record.participated === !!value
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleToggleParticipated(record.student_id, !record.participated)}
          >
            {record.participated ? 'Đánh dấu chưa tham gia' : 'Đánh dấu đã tham gia'}
          </Button>
          <Button 
            danger
            size="small" 
            onClick={() => handleRemoveStudent(record.student_id)}
          >
            Xóa
          </Button>
        </div>
      )
    }
  ];

  // Fetch students not registered for this activity
  const fetchAvailableStudents = async () => {
    setLoadingAvailableStudents(true);
    try {
      const res = await api.get(`/api/student-activities/${activityId}/not-participated`);
      const allStudents = res.data.data.students || [];
      setAvailableStudents(allStudents);
    } catch (error) {
      console.error("Error fetching available students:", error);
      toast.error("Không thể tải danh sách sinh viên có thể đăng ký ❌");
    } finally {
      setLoadingAvailableStudents(false);
    }
  };
  
  // Open register modal
  const openRegisterModal = () => {
    if (!canEdit) {
      const now = new Date();
      const registrationStart = activity?.registration_start ? new Date(activity.registration_start) : null;
      
      if (registrationStart && now < registrationStart) {
        toast.error("Chưa đến thời gian đăng ký");
      } else {
        toast.error("Thời gian đăng ký đã kết thúc");
      }
      return;
    }

    fetchAvailableStudents();
    setRegisterModalVisible(true);
  };
  
  // Handle student selection
  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };
  
  // Register selected students
  const handleRegisterStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sinh viên");
      return;
    }

    if (!canEdit) {
      toast.error("Thời gian đăng ký không hợp lệ");
      setRegisterModalVisible(false);
      return;
    }
    
    try {
      await api.post(`/api/student-activities/${activityId}/students`, { 
        studentIds: selectedStudents 
      });
      
      setRegisterModalVisible(false);
      setSelectedStudents([]);
      toast.success("Đăng ký sinh viên thành công 🎉");
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error registering students:", error);
      const apiError = error as { response?: { data?: { message?: string } } };
      const errorMessage = apiError.response?.data?.message || "Đăng ký sinh viên thất bại ❌";
      toast.error(errorMessage);
    }
  };
  
  // Handle removing a student from activity
  const handleRemoveStudent = (studentId: string) => {
    setStudentIdToDelete(studentId);
    setConfirmDeleteOpen(true);
  };
  
  // Confirm removal of student
  const confirmRemoveStudent = async () => {
    if (!studentIdToDelete) return;
    
    try {
      await api.delete(`/api/student-activities/${activityId}/students/${studentIdToDelete}`);
      toast.success("Xóa sinh viên khỏi hoạt động thành công");
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Xóa sinh viên thất bại");
    } finally {
      setConfirmDeleteOpen(false);
      setStudentIdToDelete(null);
    }
  };
  
  // Handle toggling participated status
  const handleToggleParticipated = async (studentId: string, participated: boolean) => {
    try {
      await api.patch(`/api/student-activities/${activityId}`, {
        studentId,
        participated,
      });
      toast.success("Cập nhật trạng thái thành công");
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error updating participation status:", error);
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Lỗi!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700">
          Quay về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {activity?.name || 'Chi tiết hoạt động'}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Tên hoạt động:</p>
            <p className="font-medium">{activity?.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Điểm:</p>
            <p className="font-medium">{activity?.point}</p>
          </div>
          <div>
            <p className="text-gray-500">Phong trào:</p>
            <p className="font-medium">{activity?.Campaign?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Trạng thái:</p>
            <p className="font-medium">
              <Tag color={activity?.status === 'ongoing' ? 'green' : 'gray'}>
                {activity?.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
              </Tag>
            </p>
          </div>
          <div>
            <p className="text-gray-500">Bắt đầu đăng ký:</p>
            <p className="font-medium">
              {activity?.registration_start ? new Date(activity.registration_start).toLocaleDateString('vi-VN') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Kết thúc đăng ký:</p>
            <p className="font-medium">
              {activity?.registration_end ? new Date(activity.registration_end).toLocaleDateString('vi-VN') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Trạng thái phê duyệt:</p>
            <p className="font-medium">
              {activity?.approver_id !== null ? (
                <Tag color="green">Đã phê duyệt</Tag>
              ) : (
                <Tag color="orange">Chờ phê duyệt</Tag>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Danh sách sinh viên tham gia</h2>
        <div className="flex gap-4">
          {activity?.approver_id === null ? (
            <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded">
              Hoạt động đang chờ phê duyệt
            </div>
          ) : canEdit ? (
            <button
              className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
              onClick={openRegisterModal}>
              Đăng ký sinh viên
            </button>
          ) : (
            <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded">
              {new Date() < new Date(activity?.registration_start || '') 
                ? "Chưa đến thời gian đăng ký" 
                : "Thời gian đăng ký đã kết thúc"}
            </div>
          )}
          <button
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
            onClick={() => router.push('/uit/department-officers/activities')}>
            Quay về danh sách
          </button>
        </div>
      </div>

      {activity?.approver_id === null ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Hoạt động đang chờ phê duyệt</h3>
          <p className="text-yellow-700">
            Danh sách sinh viên tham gia sẽ hiển thị sau khi hoạt động được phê duyệt. 
            Sinh viên không thể đăng ký cho hoạt động chưa được phê duyệt.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Input.Search
              placeholder="Tìm kiếm theo MSSV, tên hoặc lớp..."
              onChange={handleSearchChange}
              allowClear
              className="max-w-md"
            />
          </div>

          <div ref={tableRef} className="bg-white rounded-lg shadow overflow-hidden">
            <Table 
              columns={columns} 
              dataSource={filtered}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Không có sinh viên nào' }}
            />
          </div>

          {/* Modal for registering students */}
          <Modal
            title="Đăng ký sinh viên tham gia hoạt động"
            open={registerModalVisible}
            onCancel={() => setRegisterModalVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setRegisterModalVisible(false)}>
                Hủy
              </Button>,
              <Button 
                key="register" 
                type="primary" 
                onClick={handleRegisterStudents}
                disabled={selectedStudents.length === 0}
              >
                Đăng ký {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ''}
              </Button>
            ]}
            width={800}
          >
            {loadingAvailableStudents ? (
              <Loading />
            ) : (
              <>
                <Input.Search
                  placeholder="Tìm kiếm sinh viên..."
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="mb-4"
                />
                
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chọn</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MSSV</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableStudents.filter(s => 
                        s.student_id?.toLowerCase().includes(searchStudent.toLowerCase()) || 
                        s.student_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
                        s.class?.toLowerCase().includes(searchStudent.toLowerCase())
                      ).length > 0 ? (
                        availableStudents.filter(s => 
                          s.student_id?.toLowerCase().includes(searchStudent.toLowerCase()) || 
                          s.student_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
                          s.class?.toLowerCase().includes(searchStudent.toLowerCase())
                        ).map((student) => (
                          <tr key={student.student_id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <Checkbox 
                                checked={selectedStudents.includes(student.student_id)} 
                                onChange={() => toggleStudentSelection(student.student_id)}
                              />
                            </td>
                            <td className="px-3 py-2">{student.student_id}</td>
                            <td className="px-3 py-2">{student.student_name}</td>
                            <td className="px-3 py-2">{student.class}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            {searchStudent 
                              ? 'Không tìm thấy sinh viên phù hợp' 
                              : 'Không có sinh viên nào có thể đăng ký'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Modal>
          
          {/* Confirmation modal for deleting students */}
          <ConfirmDeleteModal
            isOpen={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            onConfirm={confirmRemoveStudent}
          />
        </>
      )}
    </div>
  );
} 