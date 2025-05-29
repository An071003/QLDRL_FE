import { Table, Tag, Progress, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";

interface StudentScore {
  student_id: string;
  semester_no: number;
  academic_year: number;
  score: number;
  classification: string;
  status: 'none' | 'disciplined';
}

interface ScoreHistoryTableProps {
  scores: StudentScore[];
}

export default function ScoreHistoryTable({ scores }: ScoreHistoryTableProps) {
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#faad14';
    if (score >= 80) return '#52c41a';
    if (score >= 65) return '#1890ff';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return '#faad14';
    if (score >= 80) return '#52c41a';
    if (score >= 65) return '#1890ff';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  const columns: ColumnsType<StudentScore> = [
    {
      title: 'Học kỳ',
      key: 'semester',
      render: (record: StudentScore) => `HK${record.semester_no}/${record.academic_year}`,
      sorter: (a: StudentScore, b: StudentScore) => {
        if (a.academic_year !== b.academic_year) {
          return b.academic_year - a.academic_year;
        }
        return b.semester_no - a.semester_no;
      },
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <span style={{ color: getScoreColor(score), fontWeight: 'bold' }}>
          {score.toFixed(1)}
        </span>
      ),
      sorter: (a: StudentScore, b: StudentScore) => b.score - a.score,
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      key: 'classification',
      render: (classification: string) => (
        <Tag color={getClassificationColor(classification)}>
          {classification}
        </Tag>
      ),
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (record: StudentScore) => (
        <Progress
          percent={record.score}
          size="small"
          strokeColor={getProgressColor(record.score)}
          showInfo={false}
        />
      ),
    },
  ];

  if (scores.length === 0) {
    return <Empty description="Không có dữ liệu điểm" />;
  }

  return (
    <Table
      dataSource={scores}
      columns={columns}
      rowKey={(record) => `${record.academic_year}_${record.semester_no}`}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} học kỳ`,
      }}
    />
  );
} 