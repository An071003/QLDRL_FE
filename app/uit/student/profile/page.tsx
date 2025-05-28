'use client'

import { useState, useEffect } from "react";
import { Card, Descriptions, Tag, Statistic, Row, Col, Avatar, Button, Modal, Form, Input, DatePicker, message, Alert } from "antd";
import { UserOutlined, EditOutlined, TrophyOutlined, BookOutlined, PhoneOutlined, MailOutlined, CalendarOutlined, HomeOutlined } from "@ant-design/icons";
import { StudentLayout } from "@/components/layout/student";
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

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [form] = Form.useForm();

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
          student_id: "21520001",
          student_name: "Nguyễn Văn A",
          phone: "0123456789",
          birthdate: "2003-01-01",
          classification: "Giỏi",
          status: 'none',
          sumscore: 85.5,
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
            email: "student@example.com"
          }
        };
        setStudent(fallbackStudent);
        setIsDemoMode(true);
        toast.error("Đang sử dụng dữ liệu demo - Không thể tải thông tin sinh viên thực");
      }
    } catch (err) {
      console.error("Failed to fetch student profile:", err);
      console.log('Using fallback data due to error');
      
      // Fallback data for testing
      const fallbackStudent: StudentProfile = {
        student_id: "21520001",
        student_name: "Nguyễn Văn A",
        phone: "0123456789",
        birthdate: "2003-01-01",
        classification: "Giỏi",
        status: 'none',
        sumscore: 85.5,
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
          email: "student@example.com"
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
          sumscore: 85.5,
          classification: "Giỏi"
        });
      }
    } catch (err) {
      console.error("Failed to fetch student summary:", err);
      console.log('Using fallback summary data due to error');
      setSummary({
        sumscore: 85.5,
        classification: "Giỏi"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (student) {
      form.setFieldsValue({
        student_name: student.student_name,
        phone: student.phone,
        birthdate: student.birthdate ? dayjs(student.birthdate) : null,
      });
      setEditModalVisible(true);
    }
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

  const getClassificationColor = (classification?: string) => {
    switch (classification?.toLowerCase()) {
      case 'xuất sắc': return 'gold';
      case 'giỏi': return 'green';
      case 'khá': return 'blue';
      case 'trung bình': return 'orange';
      case 'yếu': return 'red';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'disciplined' ? 'red' : 'green';
  };

  const getStatusText = (status: string) => {
    return status === 'disciplined' ? 'Đang bị kỷ luật' : 'Bình thường';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#faad14';
    if (score >= 80) return '#52c41a';
    if (score >= 65) return '#1890ff';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  if (loading) return <Loading />;

  if (!student) {
    return (
      <StudentLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin sinh viên</h1>
          <Button type="primary" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const currentScore = summary?.sumscore || student?.sumscore || 0;
  const currentClassification = summary?.classification || student?.classification || 'Chưa xếp loại';

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Thông tin cá nhân</h1>
          <p className="text-gray-600">Quản lý và xem thông tin cá nhân của bạn</p>
        </div>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <Alert
            message="Chế độ Demo"
            description="Bạn đang xem dữ liệu demo. Vui lòng đăng nhập với tài khoản sinh viên để xem thông tin thực."
            type="warning"
            showIcon
            className="mb-6"
            closable
          />
        )}

        {/* Header Card với Avatar và thông tin cơ bản */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
          <div className="flex items-center">
            <Avatar
              size={120}
              icon={<UserOutlined />}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
            />
            <div className="flex-1 ml-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {student.student_name || 'Chưa có tên'}
              </h2>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="flex items-center">
                  <BookOutlined className="mr-2" />
                  MSSV: {student.student_id}
                </span>
                <span className="flex items-center">
                  <HomeOutlined className="mr-2" />
                  {student.Class?.name || 'Chưa có lớp'}
                </span>
                <span className="flex items-center">
                  <MailOutlined className="mr-2" />
                  {student.User?.email || 'Chưa có email'}
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                <Tag color={getStatusColor(student.status)} className="px-3 py-1">
                  {getStatusText(student.status)}
                </Tag>
                {currentClassification && currentClassification !== 'Chưa xếp loại' && (
                  <Tag color={getClassificationColor(currentClassification)} className="px-3 py-1">
                    Xếp loại: {currentClassification}
                  </Tag>
                )}
              </div>
            </div>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="large"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Chỉnh sửa
            </Button>
          </div>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Thông tin chi tiết */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <span className="flex items-center text-lg font-semibold">
                  <UserOutlined className="mr-2 text-blue-600" />
                  Thông tin chi tiết
                </span>
              }
              className="shadow-md"
            >
              <Descriptions column={1} labelStyle={{ fontWeight: 'bold', color: '#374151' }}>
                <Descriptions.Item label="Họ và tên">
                  {student.student_name || 'Chưa có tên'}
                </Descriptions.Item>
                <Descriptions.Item label="Mã số sinh viên">
                  {student.student_id}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {student.User?.email || 'Chưa có email'}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <span className="flex items-center">
                    <PhoneOutlined className="mr-2 text-green-600" />
                    {student.phone || 'Chưa có số điện thoại'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">
                  <span className="flex items-center">
                    <CalendarOutlined className="mr-2 text-orange-600" />
                    {student.birthdate ? dayjs(student.birthdate).format('DD/MM/YYYY') : 'Chưa có ngày sinh'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Lớp">
                  {student.Class?.name || 'Chưa có lớp'}
                </Descriptions.Item>
                <Descriptions.Item label="Khoa">
                  {student.Faculty?.name || 'Chưa có khoa'}
                </Descriptions.Item>
                <Descriptions.Item label="Mã khoa">
                  {student.Faculty?.faculty_abbr || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(student.status)}>
                    {getStatusText(student.status)}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Thống kê điểm */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <span className="flex items-center text-lg font-semibold">
                  <TrophyOutlined className="mr-2 text-yellow-600" />
                  Thống kê điểm rèn luyện
                </span>
              }
              className="shadow-md"
            >
              <div className="space-y-6">
                <Statistic
                  title="Tổng điểm rèn luyện"
                  value={currentScore}
                  precision={1}
                  valueStyle={{
                    color: getScoreColor(currentScore),
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}
                  suffix="/100"
                />

                {currentClassification && currentClassification !== 'Chưa xếp loại' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 mb-2">Xếp loại rèn luyện:</p>
                    <Tag
                      color={getClassificationColor(currentClassification)}
                      className="px-4 py-2 text-lg font-medium"
                    >
                      {currentClassification}
                    </Tag>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Thang điểm đánh giá:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Xuất sắc:</span>
                      <span className="font-medium">90-100 điểm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Giỏi:</span>
                      <span className="font-medium">80-89 điểm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Khá:</span>
                      <span className="font-medium">65-79 điểm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trung bình:</span>
                      <span className="font-medium">50-64 điểm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yếu:</span>
                      <span className="font-medium">Dưới 50 điểm</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Modal chỉnh sửa thông tin */}
        <Modal
          title="Chỉnh sửa thông tin cá nhân"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            className="mt-4"
          >
            <Form.Item
              label="Họ và tên"
              name="student_name"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { pattern: /^\d{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Ngày sinh"
              name="birthdate"
            >
              <DatePicker
                placeholder="Chọn ngày sinh"
                format="DD/MM/YYYY"
                className="w-full"
              />
            </Form.Item>

            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={() => setEditModalVisible(false)}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={updating}
                className="bg-blue-600"
              >
                Cập nhật
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </StudentLayout>
  );
}