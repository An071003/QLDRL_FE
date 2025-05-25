import { Card, Row, Col } from 'antd';

interface StatsOverviewProps {
  totalStudents: number;
  averageScore: number | string;
  excellentGoodRate: number | string;
  poorCount: number | string;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalStudents,
  averageScore,
  excellentGoodRate,
  poorCount
}) => {
  const formatNumber = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toFixed(2);
  };

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col span={6}>
        <Card>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Tổng sinh viên</h3>
            <p className="text-2xl text-blue-600">{totalStudents}</p>
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Điểm trung bình</h3>
            <p className="text-2xl text-green-600">{formatNumber(averageScore)}</p>
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Tỷ lệ XS & Tốt</h3>
            <p className="text-2xl text-yellow-600">{formatNumber(excellentGoodRate)}%</p>
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <div className="text-center">
            <h3 className="text-lg font-semibold">SL Sinh viên yếu</h3>
            <p className="text-2xl text-red-600">{poorCount}</p>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default StatsOverview; 