"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
import { Table, Tag, Input, Button, Modal, Checkbox, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import debounce from 'lodash.debounce';
import { Activity } from "@/types/activity";
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { UploadOutlined } from '@ant-design/icons';
import { useData } from "@/lib/contexts/DataContext";

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

export default function ActivityStudentManagement() {
  const params = useParams();
  const router = useRouter();
  const { refreshActivities } = useData();
  const activityId = params?.id as string;
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentIdToDelete, setStudentIdToDelete] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<StudentActivity[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/student-activities/${activityId}`);
      const fetchedStudents = res.data.data.students;
      setStudents(fetchedStudents);
    } catch (err) {
      toast.error("Không thể tải danh sách sinh viên tham gia ❌");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityInfo = async () => {
    try {
      const activityRes = await api.get(`/api/activities/${activityId}`);
      const activityData = activityRes.data.data.activity;
      setActivity(activityData);

      if (activityData.status === "ongoing") {
        const currentDate = new Date();
        const registrationStart = activityData.registration_start ? new Date(activityData.registration_start) : null;
        const registrationEnd = activityData.registration_end ? new Date(activityData.registration_end) : null;

        if (registrationStart && registrationEnd &&
          currentDate >= registrationStart &&
          currentDate <= registrationEnd) {
          setCanEdit(true);
        }
      }
    } catch (error) {
      toast.error("Không thể tải thông tin hoạt động");
    }
  };

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

  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

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
      await fetchStudents();
    } catch (error: any) {
      console.error("Error registering students:", error);
      const errorMessage = error.response?.data?.message || "Đăng ký sinh viên thất bại ❌";
      toast.error(errorMessage);
    }
  };

  const handleImportStudents = async (file: File) => {
    if (!canEdit) {
      toast.error("Thời gian đăng ký không hợp lệ");
      setImportModalVisible(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/api/student-activities/${activityId}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImportModalVisible(false);
      toast.success("Import sinh viên thành công 🎉");
      await fetchStudents();
    } catch (error: any) {
      console.error("Error importing students:", error);
      const errorMessage = error.response?.data?.message || "Import sinh viên thất bại ❌";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchActivityInfo();
  }, [activityId]);

  const handleToggleParticipated = async (studentId: string, participated: boolean) => {
    try {
      await api.patch(`/api/student-activities/${activityId}`, {
        studentId: studentId,
        participated: participated,
      });
      await fetchStudents();
      toast.success("Cập nhật trạng thái tham gia thành công ✅");
    } catch (err) {
      toast.error("Cập nhật trạng thái thất bại ❌");
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudentIdToDelete(studentId);
    setConfirmDeleteOpen(true);
  };

  const confirmRemoveStudent = async () => {
    if (!studentIdToDelete) return;

    try {
      await api.delete(`/api/student-activities/${activityId}/students/${studentIdToDelete}`);
      await fetchStudents();
      toast.success("Xóa sinh viên khỏi hoạt động thành công ✅");
    } catch (err) {
      toast.error("Xóa sinh viên thất bại ❌");
    } finally {
      setConfirmDeleteOpen(false);
      setStudentIdToDelete(null);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (updatedActivity: Partial<Activity>) => {
    try {
      const response = await api.put(`/api/activities/${activityId}`, {
        ...updatedActivity,
        is_approved: true,
        status: 'ongoing'
      });
      setIsEditing(false);
      await fetchActivityInfo();
      await refreshActivities();
      toast.success("Cập nhật hoạt động thành công");
      router.push('/uit/admin/activities?tab=approved');
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Cập nhật hoạt động thất bại");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    router.push('/uit/admin/activities?tab=approved');
  };

  const handleApprove = async () => {
    try {
      await api.put(`/api/activities/${activityId}/approve`);
      toast.success("Phê duyệt hoạt động thành công");
      await fetchActivityInfo(); // Refresh activity data
    } catch (error) {
      console.error("Error approving activity:", error);
      toast.error("Phê duyệt hoạt động thất bại");
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/api/activities/${activityId}/reject`);
      toast.success("Từ chối hoạt động thành công");
      await fetchActivityInfo(); // Refresh activity data
    } catch (error) {
      console.error("Error rejecting activity:", error);
      toast.error("Từ chối hoạt động thất bại");
    }
  };

  const columns: ColumnsType<StudentActivity> = [
    {
      title: 'STT',
      key: 'index',
      width: 70,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'MSSV',
      dataIndex: 'student_id',
      key: 'student_id',
      width: 120,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 200,
    },
    {
      title: 'Lớp',
      dataIndex: ['Class', 'name'],
      key: 'class',
      width: 120,
    },
    {
      title: 'Trạng thái tham gia',
      key: 'participated',
      width: 150,
      render: (_, record) => (
        <Checkbox
          checked={record.participated}
          onChange={(e) => handleToggleParticipated(record.student_id, e.target.checked)}
          disabled={!canEdit}
        >
          Đã tham gia
        </Checkbox>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => (
        canEdit && (
          <Button
            danger
            onClick={() => handleRemoveStudent(record.student_id)}
          >
            Xóa
          </Button>
        )
      ),
    },
  ];

  const filteredStudents = students.filter(student =>
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.Class?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Sinh viên tham gia hoạt động</h1>
        <div className="flex gap-4">
          {activity?.approver_id === null ? (
            <>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Phê duyệt
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Từ chối
              </button>
            </>
          ) : (
            canEdit && (
              <>
                <button
                  onClick={() => setRegisterModalVisible(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Đăng ký sinh viên
                </button>
                <button
                  onClick={() => setImportModalVisible(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Import sinh viên
                </button>
              </>
            )
          )}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>

      {activity && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Thông tin hoạt động</h2>
            {activity.approver_id !== null && canEdit && !isEditing && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Chỉnh sửa
              </button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave({
                    name: activity.name,
                    point: activity.point,
                    campaign_id: activity.campaign_id,
                    max_participants: activity.max_participants,
                    registration_start: activity.registration_start,
                    registration_end: activity.registration_end,
                    status: activity.status
                  })}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Lưu
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Tên hoạt động:</p>
              {isEditing ? (
                <Input
                  defaultValue={activity.name}
                  onChange={(e) => {
                    setActivity({ ...activity, name: e.target.value });
                  }}
                />
              ) : (
                <p className="font-medium">{activity.name}</p>
              )}
            </div>
            <div>
              <p className="text-gray-600">Điểm:</p>
              {isEditing ? (
                <Input
                  type="number"
                  defaultValue={activity.point}
                  onChange={(e) => {
                    setActivity({ ...activity, point: Number(e.target.value) });
                  }}
                />
              ) : (
                <p className="font-medium">
                  <span className={activity.point < 0 ? "text-red-600" : "text-green-600"}>
                    {activity.point}
                    <span className="ml-2 text-xs">
                      {activity.point < 0 ? '(Trừ điểm)' : '(Cộng điểm)'}
                    </span>
                  </span>
                </p>
              )}
            </div>
            <div>
              <p className="text-gray-600">Phong trào:</p>
              <p className="font-medium">{activity.Campaign?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Trạng thái:</p>
              {isEditing ? (
                <select
                  defaultValue={activity.status}
                  onChange={(e) => {
                    setActivity({ ...activity, status: e.target.value as "ongoing" | "expired" });
                  }}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="ongoing">Đang diễn ra</option>
                  <option value="expired">Đã kết thúc</option>
                </select>
              ) : (
                <Tag color={activity.status === 'ongoing' ? 'green' : 'default'}>
                  {activity.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                </Tag>
              )}
            </div>
            <div>
              <p className="text-gray-600">Số lượng đăng ký:</p>
              {isEditing ? (
                <Input
                  type="number"
                  defaultValue={activity.max_participants}
                  onChange={(e) => {
                    setActivity({ ...activity, max_participants: Number(e.target.value) });
                  }}
                />
              ) : (
                <p className="font-medium">{activity.number_students || 0} / {activity.max_participants || 'Không giới hạn'}</p>
              )}
            </div>
            <div>
              <p className="text-gray-600">Thời gian đăng ký:</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    type="date"
                    defaultValue={activity.registration_start?.split('T')[0]}
                    onChange={(e) => {
                      setActivity({ ...activity, registration_start: e.target.value });
                    }}
                  />
                  <Input
                    type="date"
                    defaultValue={activity.registration_end?.split('T')[0]}
                    onChange={(e) => {
                      setActivity({ ...activity, registration_end: e.target.value });
                    }}
                  />
                </div>
              ) : (
                <p className="font-medium">
                  {activity.registration_start && activity.registration_end
                    ? `${new Date(activity.registration_start).toLocaleDateString('vi-VN')} - ${new Date(activity.registration_end).toLocaleDateString('vi-VN')}`
                    : 'Không có thông tin'}
                </p>
              )}
            </div>
            <div>
              <p className="text-gray-600">Trạng thái phê duyệt:</p>
              <p className="font-medium">
                {activity.approver_id !== null ? (
                  <Tag color="green">Đã phê duyệt</Tag>
                ) : (
                  <Tag color="orange">Chờ phê duyệt</Tag>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <Input.Search
            placeholder="Tìm kiếm theo MSSV, tên sinh viên hoặc lớp..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Register Modal */}
      <Modal
        title="Đăng ký sinh viên tham gia hoạt động"
        open={registerModalVisible}
        onCancel={() => {
          setRegisterModalVisible(false);
          setSelectedStudents([]);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRegisterModalVisible(false);
              setSelectedStudents([]);
            }}
          >
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
                  {availableStudents
                    .filter(s =>
                      s.student_id?.toLowerCase().includes(searchStudent.toLowerCase()) ||
                      s.student_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
                      (s.Class?.name || '').toLowerCase().includes(searchStudent.toLowerCase())
                    )
                    .map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={selectedStudents.includes(student.student_id)}
                            onChange={() => toggleStudentSelection(student.student_id)}
                          />
                        </td>
                        <td className="px-3 py-2">{student.student_id}</td>
                        <td className="px-3 py-2">{student.student_name}</td>
                        <td className="px-3 py-2">{student.Class?.name}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import danh sách sinh viên"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-600 mb-2">Tải file mẫu:</p>
            <Button type="link" onClick={() => window.open('/templates/student-import-template.xlsx', '_blank')}>
              Tải xuống file mẫu
            </Button>
          </div>

          <Upload.Dragger
            accept=".xlsx,.xls"
            beforeUpload={(file) => {
              handleImportStudents(file);
              return false;
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Nhấp hoặc kéo file vào đây để tải lên</p>
            <p className="ant-upload-hint">Chỉ hỗ trợ file Excel (.xlsx, .xls)</p>
          </Upload.Dragger>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmRemoveStudent}
      />
    </div>
  );
}
