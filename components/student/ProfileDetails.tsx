import { Card, Descriptions, Tag } from "antd";
import { UserOutlined, PhoneOutlined, CalendarOutlined } from "@ant-design/icons";
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

interface ProfileDetailsProps {
  student: StudentProfile;
}

export default function ProfileDetails({ student }: ProfileDetailsProps) {
  const getStatusColor = (status: string) => {
    return status === 'disciplined' ? 'red' : 'green';
  };

  const getStatusText = (status: string) => {
    return status === 'disciplined' ? 'Đang bị kỷ luật' : 'Bình thường';
  };

  return (
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
  );
} 