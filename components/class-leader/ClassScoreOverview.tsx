import { Card, Row, Col, Statistic, Progress } from "antd";
import { TrophyOutlined, TeamOutlined, RiseOutlined, FallOutlined } from "@ant-design/icons";

interface ClassStats {
  totalStudents: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  fairCount: number;
  averageCount: number;
  poorCount: number;
  excellentGoodRate: number;
}

interface ClassScoreOverviewProps {
  stats: ClassStats;
  className: string;
}

export default function ClassScoreOverview({ stats, className }: ClassScoreOverviewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#faad14';
    if (score >= 80) return '#52c41a';
    if (score >= 65) return '#1890ff';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  const getStatusIcon = (rate: number) => {
    if (rate >= 80) return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (rate >= 60) return <RiseOutlined style={{ color: '#faad14' }} />;
    return <FallOutlined style={{ color: '#f5222d' }} />;
  };

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Tổng quan điểm lớp {className}</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center bg-gradient-to-r from-blue-50 to-blue-100">
            <Statistic
              title="Tổng số sinh viên"
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '2rem' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center bg-gradient-to-r from-green-50 to-green-100">
            <Statistic
              title="Điểm trung bình"
              value={stats.averageScore}
              precision={1}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: getScoreColor(stats.averageScore), fontSize: '2rem' }}
              suffix="/100"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center bg-gradient-to-r from-yellow-50 to-yellow-100">
            <Statistic
              title="Tỷ lệ Giỏi - Xuất sắc"
              value={stats.excellentGoodRate}
              precision={1}
              prefix={getStatusIcon(stats.excellentGoodRate)}
              valueStyle={{ 
                color: stats.excellentGoodRate >= 80 ? '#52c41a' : stats.excellentGoodRate >= 60 ? '#faad14' : '#f5222d',
                fontSize: '2rem' 
              }}
              suffix="%"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center bg-gradient-to-r from-red-50 to-red-100">
            <Statistic
              title="Số sinh viên yếu"
              value={stats.poorCount}
              valueStyle={{ 
                color: stats.poorCount === 0 ? '#52c41a' : '#f5222d',
                fontSize: '2rem' 
              }}
              suffix={`/${stats.totalStudents}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Distribution Chart */}
      <Card className="mt-4" title="Phân bố xếp loại">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.totalStudents > 0 ? (stats.excellentCount / stats.totalStudents) * 100 : 0}
                strokeColor="#faad14"
                size={80}
                format={() => stats.excellentCount}
              />
              <p className="mt-2 font-medium">Xuất sắc</p>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={4}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.totalStudents > 0 ? (stats.goodCount / stats.totalStudents) * 100 : 0}
                strokeColor="#52c41a"
                size={80}
                format={() => stats.goodCount}
              />
              <p className="mt-2 font-medium">Giỏi</p>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={4}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.totalStudents > 0 ? (stats.fairCount / stats.totalStudents) * 100 : 0}
                strokeColor="#1890ff"
                size={80}
                format={() => stats.fairCount}
              />
              <p className="mt-2 font-medium">Khá</p>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={4}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.totalStudents > 0 ? (stats.averageCount / stats.totalStudents) * 100 : 0}
                strokeColor="#fa8c16"
                size={80}
                format={() => stats.averageCount}
              />
              <p className="mt-2 font-medium">Trung bình</p>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={4}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={stats.totalStudents > 0 ? (stats.poorCount / stats.totalStudents) * 100 : 0}
                strokeColor="#f5222d"
                size={80}
                format={() => stats.poorCount}
              />
              <p className="mt-2 font-medium">Yếu</p>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
} 