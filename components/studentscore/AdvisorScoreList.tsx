import React from 'react';
import { Table } from 'antd';
import { ColumnsType } from 'antd/es/table';

interface StudentScore {
  student_id: string;
  semester_no: number;
  academic_year: number;
  score: number;
  status: 'none' | 'disciplined';
  classification: string;
  Student?: {
    student_name: string;
    faculty_id?: number;
    class_id?: number;
    Faculty?: {
      id?: number;
      name: string;
      faculty_abbr: string;
    };
    Class?: {
      id?: number;
      name: string;
    };
  };
}

interface AdvisorScoreListProps {
  scores: StudentScore[];
}

export default function AdvisorScoreList({ 
  scores
}: AdvisorScoreListProps) {
  const columns: ColumnsType<StudentScore> = [
    {
      title: 'MSSV',
      dataIndex: 'student_id',
      key: 'student_id',
      width: '15%',
    },
    {
      title: 'Họ và tên',
      key: 'student_name',
      width: '25%',
      render: (_, record) => record.Student?.student_name,
    },
    {
      title: 'Lớp',
      key: 'class_name',
      width: '15%',
      render: (_, record) => record.Student?.Class?.name,
    },
    {
      title: 'Khoa',
      key: 'faculty_name',
      width: '20%',
      render: (_, record) => record.Student?.Faculty?.name,
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      width: '10%',
      render: (score) => score?.toFixed(2),
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      key: 'classification',
      width: '15%',
    },
  ];

  return (
    <Table
      dataSource={scores}
      columns={columns}
      rowKey="student_id"
      pagination={{
        pageSize: 10,
        showTotal: (total) => `Tổng số ${total} sinh viên`,
      }}
    />
  );
} 