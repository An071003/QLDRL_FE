import { Card, Row, Col, Statistic } from "antd";
import { TrophyOutlined, CalendarOutlined, BookOutlined } from "@ant-design/icons";

interface ScoreStatisticsProps {
  currentScore: number;
  currentClassification: string;
  totalSemesters: number;
}

export default function ScoreStatistics({
  currentScore,
  currentClassification,
  totalSemesters
}: ScoreStatisticsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#faad14';
    if (score >= 80) return '#52c41a';
    if (score >= 65) return '#1890ff';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  return (
    <Row gutter={[24, 24]} className="mb-6">
      <Col xs={24} sm={8}>
        <Card className="text-center bg-gradient-to-r from-blue-50 to-blue-100">
          <Statistic
            title="Điểm hiện tại"
            value={currentScore}
            precision={1}
            valueStyle={{ color: getScoreColor(currentScore), fontSize: '2rem' }}
            prefix={<TrophyOutlined />}
            suffix="/100"
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className="text-center bg-gradient-to-r from-green-50 to-green-100">
          <Statistic
            title="Xếp loại"
            value={currentClassification}
            valueStyle={{ color: '#52c41a', fontSize: '1.5rem' }}
            prefix={<BookOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className="text-center bg-gradient-to-r from-purple-50 to-purple-100">
          <Statistic
            title="Số học kỳ"
            value={totalSemesters}
            valueStyle={{ color: '#722ed1', fontSize: '2rem' }}
            prefix={<CalendarOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
} 