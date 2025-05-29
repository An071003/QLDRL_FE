'use client'

import { useState, useEffect } from "react";
import { Row, Col, Button, message, Alert } from "antd";
import { ClassleaderLayout } from "@/components/layout/class-leader";
import {
  ProfileHeader,
  ProfileDetails,
  ProfileStats,
  EditProfileModal
} from "@/components/student";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import dayjs from "dayjs";

interface StudentProfile {
  student_id: string;
  student_name: string;
  phone?: string;
  birthdate?: string;
  classification?: string;
  status: 'none' | 'disciplined';
  sumscore: number;
  Faculty?: {
    id: number;
    name: string;
    faculty_abbr: string;
  };
  Class?: {
    id: number;
    name: string;
  };
  User?: {
    email: string;
  };
}

interface StudentSummary {
  sumscore: number;
  classification: string;
}

interface UpdateProfileFormValues {
  student_name: string;
  phone?: string;
  birthdate?: dayjs.Dayjs;
}

export default function ClassLeaderProfilePage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
    fetchStudentSummary();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const response = await api.get('/api/students/me');
      console.log('Student profile response:', response.data);
      
      if (response.data?.status === "success" && response.data?.data?.student) {
        setStudent(response.data.data.student);
      } else {
        console.log('No student data found, using fallback');
        // Fallback data for testing
        const fallbackStudent: StudentProfile = {
          student_id: "21520002",
          student_name: "Nguyễn Văn B",
          phone: "0123456790",
          birthdate: "2003-02-15",
          classification: "Xuất sắc",
          status: 'none',
          sumscore: 92.5,
          Faculty: {
            id: 1,
            name: "Công nghệ thông tin",
            faculty_abbr: "CNTT"
          },
          Class: {
            id: 1,
            name: "21CNTT1"
          },
          User: {
            email: "classleader@example.com"
          }
        };
        setStudent(fallbackStudent);
        setIsDemoMode(true);
        toast.error("Đang sử dụng dữ liệu demo - Không thể tải thông tin lớp trưởng thực");
      }
    } catch (err) {
      console.error("Failed to fetch student profile:", err);
      console.log('Using fallback data due to error');
      
      // Fallback data for testing
      const fallbackStudent: StudentProfile = {
        student_id: "21520002",
        student_name: "Nguyễn Văn B",
        phone: "0123456790",
        birthdate: "2003-02-15",
        classification: "Xuất sắc",
        status: 'none',
        sumscore: 92.5,
        Faculty: {
          id: 1,
          name: "Công nghệ thông tin",
          faculty_abbr: "CNTT"
        },
        Class: {
          id: 1,
          name: "21CNTT1"
        },
        User: {
          email: "classleader@example.com"
        }
      };
      setStudent(fallbackStudent);
      setIsDemoMode(true);
      toast.error("Đang sử dụng dữ liệu demo - Lỗi kết nối API");
    }
  };

  const fetchStudentSummary = async () => {
    try {
      const response = await api.get('/api/students/me/summary');
      console.log('Student summary response:', response.data);
      
      if (response.data?.status === "success" && response.data?.data) {
        setSummary(response.data.data);
      } else {
        console.log('No summary data found, using fallback');
        setSummary({
          sumscore: 92.5,
          classification: "Xuất sắc"
        });
      }
    } catch (err) {
      console.error("Failed to fetch student summary:", err);
      console.log('Using fallback summary data due to error');
      setSummary({
        sumscore: 92.5,
        classification: "Xuất sắc"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleUpdateProfile = async (values: UpdateProfileFormValues) => {
    if (isDemoMode) {
      message.warning("Không thể cập nhật trong chế độ demo!");
      return;
    }
    
    setUpdating(true);
    try {
      const updateData = {
        student_name: values.student_name,
        phone: values.phone,
        birthdate: values.birthdate ? values.birthdate.format('YYYY-MM-DD') : null,
      };

      const response = await api.put('/api/students/me', updateData);
      if (response.data?.status === "success") {
        message.success("Cập nhật thông tin thành công!");
        setEditModalVisible(false);
        fetchStudentProfile();
      } else {
        message.error("Cập nhật thông tin thất bại!");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      message.error("Có lỗi xảy ra khi cập nhật thông tin!");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loading />;

  if (!student) {
    return (
      <ClassleaderLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin lớp trưởng</h1>
          <Button type="primary" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </ClassleaderLayout>
    );
  }

  const currentScore = summary?.sumscore || student?.sumscore || 0;
  const currentClassification = summary?.classification || student?.classification || 'Chưa xếp loại';

  return (
    <ClassleaderLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Thông tin cá nhân - Lớp trưởng</h1>
          <p className="text-gray-600">Quản lý và xem thông tin cá nhân của bạn</p>
        </div>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <Alert
            message="Chế độ Demo"
            description="Bạn đang xem dữ liệu demo. Vui lòng đăng nhập với tài khoản lớp trưởng để xem thông tin thực."
            type="warning"
            showIcon
            className="mb-6"
            closable
          />
        )}

        {/* Header Card với Avatar và thông tin cơ bản */}
        <ProfileHeader
          student={student}
          currentClassification={currentClassification}
          onEdit={handleEdit}
        />

        <Row gutter={[24, 24]}>
          {/* Thông tin chi tiết */}
          <Col xs={24} lg={16}>
            <ProfileDetails student={student} />
          </Col>

          {/* Thống kê điểm */}
          <Col xs={24} lg={8}>
            <ProfileStats
              currentScore={currentScore}
              currentClassification={currentClassification}
            />
          </Col>
        </Row>

        {/* Modal chỉnh sửa thông tin */}
        <EditProfileModal
          visible={editModalVisible}
          loading={updating}
          initialValues={{
            student_name: student.student_name,
            phone: student.phone,
            birthdate: student.birthdate,
          }}
          isDemoMode={isDemoMode}
          onCancel={() => setEditModalVisible(false)}
          onSubmit={handleUpdateProfile}
        />
      </div>
    </ClassleaderLayout>
  );
} 