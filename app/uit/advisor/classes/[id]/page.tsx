'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Space, Button, Tag, Tooltip, Select, message } from 'antd';
import { EyeOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
// @ts-expect-error Missing types for lodash.debounce
import debounce from 'lodash.debounce';

interface Student {
  student_id: string;
  student_name: string;
  phone?: string;
  status: 'none' | 'disciplined';
  classification?: string;
  sumscore?: number;
}

interface Class {
  id: number;
  name: string;
  cohort: string;
  faculty_id: number;
  class_leader_id?: string;
  Faculty?: {
    id: number;
    name: string;
  };
}

type TableRecord = Record<string, unknown>;

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export default function AdvisorClassStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');

  useEffect(() => {
    if (classId) {
      fetchClassAndStudents();
    }
  }, [classId]);

  useEffect(() => {
    if (classData?.class_leader_id) {
      setSelectedLeaderId(classData.class_leader_id);
    }
  }, [classData?.class_leader_id]);

  const fetchClassAndStudents = async () => {
    setLoading(true);
    try {
      const classRes = await api.get(`/api/classes/${classId}`);
      setClassData(classRes.data.data.class);
      
      // Fetch students in this class
      const studentsRes = await api.get(`/api/classes/${classId}/students`);
      if (Array.isArray(studentsRes.data.data)) {
        setStudents(studentsRes.data.data);
      } else if (studentsRes.data.data.students) {
        setStudents(studentsRes.data.data.students);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Không thể tải dữ liệu lớp và sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClassLeader = async () => {
    if (!selectedLeaderId) {
      toast.error('Vui lòng chọn lớp trưởng');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/classes/${classId}`, {
        class_leader_id: selectedLeaderId
      });
      toast.success('Cập nhật lớp trưởng thành công');
      setEditing(false);
      fetchClassAndStudents(); // Refresh data
    } catch (err) {
      console.error('Failed to update class leader:', err);
      toast.error('Cập nhật lớp trưởng thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (classData?.class_leader_id) {
      setSelectedLeaderId(classData.class_leader_id);
    } else {
      setSelectedLeaderId('');
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
        s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleViewActivities = (studentId: string) => {
    router.push(`/uit/advisor/students/${studentId}`);
  };

  const showSetLeaderModal = (student: Student, isSettingAction: boolean) => {
    setCurrentStudent(student);
    setIsSettingLeader(isSettingAction);
    setModalVisible(true);
  };

  const handleSetClassLeader = async () => {
    if (!currentStudent || !classId) return;
    
    setActionLoading(true);
    try {
      const action = isSettingLeader ? 'set' : 'unset';
      const response = await api.post(`/api/classes/${classId}/set-class-leader`, {
        studentId: currentStudent.student_id,
        action
      });

      if (response.data.status === 'success') {
        toast.success(response.data.message);
        
        // Update local state to reflect changes
        if (isSettingLeader) {
          setClassData(prev => prev ? { ...prev, class_leader_id: currentStudent.student_id } : prev);
        } else {
          setClassData(prev => prev ? { ...prev, class_leader_id: null } : prev);
        }
        
        // Refresh the data
        await fetchClassAndStudents();
      } else {
        toast.error(response.data.message || 'Không thể cập nhật lớp trưởng');
      }
    } catch (error) {
      console.error('Error setting class leader:', error);
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.message || 'Lỗi khi cập nhật lớp trưởng');
    } finally {
      setActionLoading(false);
      setModalVisible(false);
    }
  };

  const columns = [
    {
      title: 'Mã số sinh viên',
      dataIndex: 'student_id',
      key: 'student_id',
      sorter: (a: Student, b: Student) => (a.student_id || '').localeCompare(b.student_id || ''),
    },
    {
      title: 'Tên sinh viên',
      dataIndex: 'student_name',
      key: 'student_name',
      sorter: (a: Student, b: Student) => (a.student_name || '').localeCompare(b.student_name || ''),
      render: (text: string, record: Student) => (
        <div className="flex items-center gap-2">
          <Tooltip title={text}>
            <div className="max-w-xs truncate">{text}</div>
          </Tooltip>
          {record.student_id === classData?.class_leader_id && (
            <Tag color="blue">Lớp trưởng</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'sumscore',
      key: 'sumscore',
      sorter: (a: Student, b: Student) => (a.sumscore || 0) - (b.sumscore || 0),
      render: (text: number) => text || 0,
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      key: 'classification',
      render: (text: string) => text || 'Chưa xếp loại',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'disciplined' ? 'red' : 'green'}>
          {status === 'disciplined' ? 'Vi phạm kỷ luật' : 'Bình thường'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: TableRecord, record: Student) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => handleViewActivities(record.student_id)}
          >
            Xem hoạt động
          </Button>
          
          {classData?.class_leader_id === record.student_id ? (
            <Button
              type="default"
              danger
              icon={<StopOutlined />}
              onClick={() => showSetLeaderModal(record, false)}
            >
              Bỏ lớp trưởng
            </Button>
          ) : (
            <Button
              type="default"
              icon={<CrownOutlined />}
              onClick={() => showSetLeaderModal(record, true)}
            >
              Thiết lập làm lớp trưởng
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sinh viên lớp {classData?.name}</h1>
        <button
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          onClick={() => window.history.back()}>
          Quay về danh sách
        </button>
      </div>

      {classData && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500">Tên lớp:</p>
              <p className="font-medium">{classData.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Khóa:</p>
              <p className="font-medium">{classData.cohort}</p>
            </div>
            <div>
              <p className="text-gray-500">Khoa:</p>
              <p className="font-medium">{classData.Faculty?.name || 'N/A'}</p>
            </div>
          </div>
          
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 mb-2">Lớp trưởng:</p>
                {editing ? (
                  <div className="flex items-center gap-4">
                    <Select
                      className="w-full"
                      value={selectedLeaderId || undefined}
                      onChange={setSelectedLeaderId}
                      placeholder="Chọn lớp trưởng"
                      options={students.map(student => ({
                        value: student.student_id,
                        label: `${student.student_name} (${student.student_id})`
                      }))}
                    />
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={handleSaveClassLeader}
                      loading={saving}
                    >
                      Lưu
                    </Button>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <p className="font-medium">
                      {students.find(s => s.student_id === classData.class_leader_id)?.student_name || 'Chưa có lớp trưởng'}
                    </p>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => setEditing(true)}
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm theo mã số, tên hoặc số điện thoại..."
          onChange={handleSearchChange}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <Table 
          columns={columns} 
          dataSource={filteredStudents}
          rowKey="student_id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Không có sinh viên nào trong lớp này' }}
        />
      </div>

      <Modal
        title={isSettingLeader ? "Thiết lập lớp trưởng" : "Bỏ lớp trưởng"}
        open={modalVisible}
        onOk={handleSetClassLeader}
        onCancel={() => setModalVisible(false)}
        confirmLoading={actionLoading}
        okText={isSettingLeader ? "Thiết lập" : "Bỏ vai trò"}
        cancelText="Hủy"
      >
        <p>
          {isSettingLeader 
            ? `Bạn có chắc chắn muốn thiết lập sinh viên "${currentStudent?.student_name}" làm lớp trưởng không?`
            : `Bạn có chắc chắn muốn bỏ vai trò lớp trưởng của sinh viên "${currentStudent?.student_name}" không?`
          }
        </p>
        {isSettingLeader && classData?.class_leader_id && (
          <p className="text-yellow-600 mt-2">
            Lưu ý: Sinh viên đang là lớp trưởng hiện tại sẽ trở lại vai trò sinh viên thông thường.
          </p>
        )}
      </Modal>
    </div>
  );
} 