import { Table, Tooltip, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Activity } from "@/types/activity";

interface ActivityTableProps {
  activities: Activity[];
  selectedRows: number[];
  onSelectionChange: (keys: number[]) => void;
  loading?: boolean;
}

export default function ActivityTable({
  activities,
  selectedRows,
  onSelectionChange,
  loading = false
}: ActivityTableProps) {
  const columns: ColumnsType<Activity> = [
    { 
      title: "Tên hoạt động", 
      dataIndex: "name", 
      key: "name",
      ellipsis: {
        showTitle: false,
      },
      render: (name) => (
        <Tooltip placement="topLeft" title={name}>
          <span>{name}</span>
        </Tooltip>
      )
    },
    { 
      title: "Phong trào", 
      dataIndex: ["Campaign", "name"], 
      key: "campaign_name",
      ellipsis: {
        showTitle: false,
      },
      render: (text, record) => (
        <Tooltip placement="topLeft" title={record.Campaign?.name}>
          <span>{record.Campaign?.name}</span>
        </Tooltip>
      )
    },
    { title: "Điểm", dataIndex: "point", key: "point" },
  ];

  if (activities.length === 0) {
    return (
      <Empty 
        description={loading ? "Đang tải..." : "Không có hoạt động nào"} 
        className="py-12"
      />
    );
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={activities}
      rowSelection={{
        selectedRowKeys: selectedRows,
        onChange: (keys) => onSelectionChange(keys as number[]),
      }}
      pagination={false}
      loading={loading}
    />
  );
} 