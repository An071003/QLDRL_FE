import { Card, Statistic, Tag } from "antd";
import { TrophyOutlined } from "@ant-design/icons";

interface ProfileStatsProps {
  currentScore: number;
  currentClassification: string;
}

export default function ProfileStats({ currentScore, currentClassification }: ProfileStatsProps) {
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

  return (
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
  );
}