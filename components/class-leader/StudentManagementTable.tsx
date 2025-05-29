import { Table, Tag, Button, Space, Input } from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

// Generic student interface that works with both API and demo data
interface StudentData {
  student_id: string;
  student_name: string | null;
  phone?: string | null;
  birthdate?: string | null;
  status: 'none' | 'disciplined';
  classification?: string | null;
  sumscore?: number;
  Class?: {
    id: number;
    name: string;
  };
  Faculty?: {
    id: number;
    name: string;
    faculty_abbr: string;
  };
  User?: {
    email: string;
  };
}

interface StudentManagementTableProps {
  students: StudentData[];
  loading?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onViewStudent?: (studentId: string) => void;
}

export default function StudentManagementTable({
  students,
  loading = false,
  searchTerm,
  onSearchChange,
  onViewStudent
}: StudentManagementTableProps) {
  const getStatusColor = (status: string) => {
    return status === 'disciplined' ? 'red' : 'green';
  };

  const getStatusText = (status: string) => {
    return status === 'disciplined' ? 'Kỷ luật' : 'Bình thường';
  };

  const getClassificationColor = (classification: string | null) => {
    if (!classification) return 'default';
    switch (classification.toLowerCase()) {
      case 'xuất sắc': return 'gold';
      case 'giỏi': return 'green';
      case 'khá': return 'blue';
      case 'trung bình': return 'orange';
      case 'yếu': return 'red';
      default: return 'default';
    }
  };

  const columns: ColumnsType<StudentData> = [
    {
      title: 'MSSV',
      dataIndex: 'student_id',
      key: 'student_id',
      sorter: (a, b) => (a.student_id || '').localeCompare(b.student_id || ''),
      fixed: 'left',
      width: 120,
    },
    {
      title: 'Tên sinh viên',
      dataIndex: 'student_name',
      key: 'student_name',
      sorter: (a, b) => (a.student_name || '').localeCompare(b.student_name || ''),
      width: 200,
      ellipsis: true,
      render: (name: string | null) => name || 'N/A',
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => record.User?.email || 'N/A',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | null) => phone || 'N/A',
      width: 120,
    },
    {
      title: 'Điểm RL',
      dataIndex: 'sumscore',
      key: 'sumscore',
      sorter: (a, b) => (a.sumscore || 0) - (b.sumscore || 0),
      render: (score: number) => score?.toFixed(1) || '0.0',
      width: 100,
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      key: 'classification',
      render: (classification: string | null) => (
        <Tag color={getClassificationColor(classification)}>
          {classification || 'Chưa xếp loại'}
        </Tag>
      ),
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      width: 120,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewStudent?.(record.student_id)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Search and Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Tìm theo MSSV, tên sinh viên..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={students}
        rowKey="student_id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sinh viên`,
        }}
        locale={{
          emptyText: searchTerm ? 'Không tìm thấy sinh viên nào' : 'Chưa có sinh viên trong lớp'
        }}
      />
    </div>
  );
} 