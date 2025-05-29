'use client';

import { Table } from 'antd';
import { Activity } from '@/types/studentscorepage';

type Props = {
  activities: Activity[];
  totalScore: number;
  maxScore: number;
  campaignIndex: number;
};

export default function ActivityTable({ activities, totalScore, maxScore, campaignIndex }: Props) {
  return (
    <Table
      dataSource={activities}
      pagination={false}
      rowKey="id"
      size="small"
      columns={[
        { title: 'Tên hoạt động', dataIndex: 'name', key: 'name' },
        { title: 'Điểm', dataIndex: 'point', key: 'point', width: 70 },
        { title: 'Có', dataIndex: 'has_participated', key: 'has_participated', width: 60, render: (val: boolean) => val ? '✓' : '' },
        { title: 'Không', dataIndex: 'has_participated', key: 'no_participate', width: 70, render: (val: boolean) => !val ? '✓' : '' },
        { title: 'Điểm đạt được', dataIndex: 'awarded_score', key: 'awarded_score', width: 100 },
        { title: 'Chú thích', dataIndex: 'note', key: 'note', width: 130 },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120 },
        { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 80 },
      ]}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={8}>
            <span className="font-bold text-blue-700">Tổng điểm phong trào {campaignIndex + 1}: {totalScore} / {maxScore}</span>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
  );
}
