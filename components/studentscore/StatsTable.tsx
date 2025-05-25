import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface StatsTableProps {
  data: any[];
  type: 'faculty' | 'class' | 'cohort';
  title?: string;
}

const StatsTable: React.FC<StatsTableProps> = ({ data, type, title }) => {
  const getColumns = (): ColumnsType<any> => {
    const baseColumns = [
      {
        title: 'Điểm TB',
        dataIndex: 'average_score',
        key: 'average_score',
        width: '20%',
        align: 'right' as const,
        render: (score: number | string) => {
          const numScore = typeof score === 'string' ? parseFloat(score) : score;
          return numScore.toFixed(2);
        },
        sorter: (a, b) => {
          const scoreA = typeof a.average_score === 'string' ? parseFloat(a.average_score) : a.average_score;
          const scoreB = typeof b.average_score === 'string' ? parseFloat(b.average_score) : b.average_score;
          return scoreB - scoreA;
        },
      },
      {
        title: 'SL Sinh viên',
        dataIndex: 'total_students',
        key: 'total_students',
        width: '20%',
        align: 'right' as const,
        render: (value: any) => Number(value),
        sorter: (a, b) => Number(a.total_students) - Number(b.total_students),
      },
      {
        title: 'Tỷ lệ XS & Tốt',
        key: 'excellent_good_rate',
        width: '20%',
        align: 'right' as const,
        render: (_, record) => {
          const excellent = Number(record.excellent_count);
          const good = Number(record.good_count);
          const total = Number(record.total_students);
          const rate = total > 0 ? ((excellent + good) / total) * 100 : 0;
          return `${rate.toFixed(2)}%`;
        },
        sorter: (a, b) => {
          const rateA = ((Number(a.excellent_count) + Number(a.good_count)) / Number(a.total_students)) * 100;
          const rateB = ((Number(b.excellent_count) + Number(b.good_count)) / Number(b.total_students)) * 100;
          return rateB - rateA;
        },
      }
    ];

    const nameColumn = {
      title: type === 'faculty' ? 'Tên khoa' : type === 'class' ? 'Tên lớp' : 'Khóa',
      dataIndex: type === 'faculty' ? 'faculty_name' : type === 'class' ? 'class_name' : 'cohort',
      key: 'name',
      width: '40%',
    };

    return [nameColumn, ...baseColumns];
  };

  return (
    <Table 
      columns={getColumns()} 
      dataSource={data} 
      pagination={false}
      rowKey={type === 'faculty' ? 'faculty_abbr' : type === 'class' ? 'class_name' : 'cohort'}
      title={title ? () => title : undefined}
      bordered
      size="middle"
    />
  );
};

export default StatsTable; 