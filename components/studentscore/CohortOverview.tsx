'use client';

import { Card, Row, Col } from 'antd';
import PieChart from './PieChart';

interface CohortOverviewProps {
  overview: {
    total_students: number;
    average_score: number;
    excellent_percentage: number;
    good_percentage: number;
    poor_percentage: number;
  };
  scoreDistribution: Array<{
    classification_group: string;
    count: number;
    percentage: number;
  }>;
  selectedYear?: string;
}

const CohortOverview: React.FC<CohortOverviewProps> = ({ 
  overview, 
  scoreDistribution,
  selectedYear 
}) => {
  return (
    <>
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Tổng sinh viên</h3>
              <p className="text-2xl text-blue-600">{overview?.total_students || 0}</p>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Điểm trung bình</h3>
              <p className="text-2xl text-green-600">
                {typeof overview?.average_score === 'number' 
                  ? overview.average_score.toFixed(2) 
                  : Number(overview?.average_score || 0).toFixed(2)}
              </p>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Tỷ lệ XS & Tốt</h3>
              <p className="text-2xl text-yellow-600">
                {(Number(overview?.excellent_percentage || 0) + 
                  Number(overview?.good_percentage || 0)).toFixed(2)}%
              </p>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <h3 className="text-lg font-semibold">SL Sinh viên yếu</h3>
              <p className="text-2xl text-red-600">
                {Number(overview?.poor_percentage || 0)}%
              </p>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {selectedYear === 'all' ? 'Phân bố xếp loại tất cả khóa' : `Phân bố xếp loại khóa ${selectedYear}`}
        </h3>
        <div className="flex flex-col items-center">
          {scoreDistribution && <PieChart data={scoreDistribution} />}
          <div className="mt-4 w-full max-w-2xl">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Xếp loại</th>
                  <th className="px-4 py-2 text-right">Số lượng</th>
                  <th className="px-4 py-2 text-right">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {scoreDistribution?.map((item) => (
                  <tr key={item.classification_group}>
                    <td className="px-4 py-2">{item.classification_group}</td>
                    <td className="px-4 py-2 text-right">{item.count}</td>
                    <td className="px-4 py-2 text-right">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </>
  );
};

export default CohortOverview; 