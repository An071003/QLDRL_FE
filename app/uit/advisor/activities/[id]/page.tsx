'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
import { Table, Tag, Input, Modal, Button, Checkbox } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import debounce from 'lodash.debounce';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

interface StudentActivity {
  id: number;
  student_id: string;
  student_name: string;
  class?: string;
  faculty?: string;
  participated: boolean;
  Class?: {
    id: number;
    name: string;
  };
}

interface Activity {
  id: number;
  name: string;
  point: number;
  max_participants: number;
  number_students: number;
  status: 'ongoing' | 'expired';
  registration_start: string;
  registration_end: string;
  approver_id: number | null;
  approved_at: string | null;
  created_by: number;
  created_at: string;
  campaign_id: number;
  Campaign?: {
    id: number;
    name: string;
    max_score: number;
    semester_no: number;
    academic_year: string;
  };
}

interface Class {
  id: number;
  name: string;
  cohort: string;
  faculty_id: number;
  Faculty?: {
    id: number;
    name: string;
  };
}

export default function AdvisorActivityStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [search, setSearch] = useState("");
  const [managedClasses, setManagedClasses] = useState<Class[]>([]);
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
    try {
      // Fetch activity details with campaign information
      const activityRes = await api.get(`/api/activities/${activityId}`);
      const activityData = activityRes.data.data.activity;
      
      // Fetch campaign details if available
      if (activityData && activityData.campaign_id) {
        const campaignRes = await api.get(`/api/campaigns/${activityData.campaign_id}`);
        if (campaignRes.data.data.campaign) {
          activityData.Campaign = campaignRes.data.data.campaign;
        }
      }
      
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
      
      const studentsRes = await api.get(`/api/student-activities/${activityId}`);
      const fetchedStudents = studentsRes.data.data.students || [];
      
      const enhancedStudents = await Promise.all(
        fetchedStudents.map(async (student: StudentActivity) => {
          try {
            if (student.student_id) {
              // Get student details including class
              const studentRes = await api.get(`/api/students/${student.student_id}`);
              const studentData = studentRes.data.data.student;
              
              if (studentData) {
                let className = student.class || '';
                
                if (studentData.class_id && !className) {
                  try {
                    const classRes = await api.get(`/api/classes/${studentData.class_id}`);
                    if (classRes.data.data && classRes.data.data.class) {
                      className = classRes.data.data.class.name;
                    }
                  } catch (classError) {
                    console.error(`Error fetching class for student ${student.student_id}:`, classError);
                  }
                }
                
                return {
                  ...student,
                  student_name: studentData.student_name || student.student_name || 'N/A',
                  class: className || 'N/A'
                };
              }
            }
            return student;
          } catch (error) {
            console.error(`Error fetching details for student ${student.student_id}:`, error);
            return student;
          }
        })
      );
      
      setStudents(enhancedStudents);
    } catch (error) {
      console.error("Error loading activity data:", error);
      toast.error("Không thể tải dữ liệu hoạt động ❌");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchData();
    fetchManagedClasses();
  }, [activityId, fetchData]);

  const fetchManagedClasses = async () => {
    try {
      // Get current user info
      const userRes = await api.get('/api/auth/me');
      if (!userRes.data?.data?.user?.id) {
        toast.error("Không thể lấy thông tin người dùng");
        return;
      }

      // Get advisor details with managed classes
      const advisorRes = await api.get(`/api/advisors/user/${userRes.data.data.user.id}`);
      if (advisorRes.data?.advisor) {
        const classes = advisorRes.data.advisor.Classes || advisorRes.data.advisor.Class || [];
        console.log("Managed classes:", classes);
        setManagedClasses(classes);
      }
    } catch (err) {
      console.error("Failed to fetch managed classes:", err);
      toast.error("Không thể tải danh sách lớp phụ trách");
    }
  };
  
  // Fetch students not registered for this activity
  const fetchAvailableStudents = async () => {
    setLoadingAvailableStudents(true);
    try {
      const res = await api.get(`/api/student-activities/${activityId}/not-participated`);
      const allStudents = res.data.data.students || [];
      console.log("All available students:", allStudents);
      
      // Filter students to only include those from managed classes
      const managedClassNames = managedClasses.map(c => c.name);
      console.log("Managed class names:", managedClassNames);
      
      const filteredStudents = allStudents.filter((student: StudentActivity) => {
        const isInManagedClass = student.class && managedClassNames.includes(student.class);
        console.log(`Student ${student.student_id} in managed class:`, isInManagedClass);
        return isInManagedClass;
      });
      
      console.log("Filtered students:", filteredStudents);
      setAvailableStudents(filteredStudents);
    } catch (error) {
      console.error("Error fetching available students:", error);
      toast.error("Không thể tải danh sách sinh viên có thể đăng ký ❌");
    } finally {
      setLoadingAvailableStudents(false);
    }
  };
  
  // Open register modal
  const openRegisterModal = () => {
    if (managedClasses.length === 0) {
      toast.error("Bạn chưa được phân công quản lý lớp nào");
      return;
    }

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
  
  // Filter available students based on search
  const filteredAvailableStudents = availableStudents.filter(s => 
    s.student_id?.toLowerCase().includes(searchStudent.toLowerCase()) || 
    s.student_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.class?.toLowerCase().includes(searchStudent.toLowerCase())
  );

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

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {activity?.name || 'Chi tiết hoạt động'}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Tên hoạt động:</p>
            <p className="font-medium">{activity?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Điểm:</p>
            <p className="font-medium">{activity?.point || 'N/A'}</p>
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
            <p className="text-gray-500">Số lượng đăng ký tối đa:</p>
            <p className="font-medium">{activity?.max_participants || 'Không giới hạn'}</p>
          </div>
          <div>
            <p className="text-gray-500">Số sinh viên tham gia:</p>
            <p className="font-medium">{activity?.number_students || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">Học kỳ:</p>
            <p className="font-medium">
              {activity?.Campaign 
                ? `Học kỳ ${activity.Campaign.semester_no} - ${activity.Campaign.academic_year}` 
                : 'N/A'}
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
            onClick={() => router.push('/uit/advisor/activities')}>
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
            Bạn không thể đăng ký sinh viên cho hoạt động chưa được phê duyệt.
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
        </>
      )}
      
      {activity?.approver_id !== null && (
        <>
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
                      {filteredAvailableStudents.length > 0 ? (
                        filteredAvailableStudents.map((student) => (
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