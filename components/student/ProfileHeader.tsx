import { Card, Avatar, Button, Tag } from "antd";
import { UserOutlined, EditOutlined, BookOutlined, HomeOutlined, MailOutlined } from "@ant-design/icons";

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

interface ProfileHeaderProps {
  student: StudentProfile;
  currentClassification: string;
  onEdit: () => void;
}

export default function ProfileHeader({ student, currentClassification, onEdit }: ProfileHeaderProps) {
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

  return (
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
          onClick={onEdit}
          size="large"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Chỉnh sửa
        </Button>
      </div>
    </Card>
  );
} 