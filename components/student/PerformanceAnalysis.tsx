import { Card, Row, Col } from "antd";

interface StudentScore {
  student_id: string;
  semester_no: number;
  academic_year: number;
  score: number;
  classification: string;
  status: 'none' | 'disciplined';
}

interface PerformanceAnalysisProps {
  scores: StudentScore[];
}

export default function PerformanceAnalysis({ scores }: PerformanceAnalysisProps) {
  // Sort scores by year and semester correctly (ascending order: HK1 before HK2)
  const sortedScores = [...scores].sort((a, b) => {
    if (a.academic_year !== b.academic_year) {
      return a.academic_year - b.academic_year;
    }
    return a.semester_no - b.semester_no;
  });

  const getTrendAnalysis = () => {
    if (sortedScores.length >= 2) {
      const firstScore = sortedScores[0].score;
      const lastScore = sortedScores[sortedScores.length - 1].score;
      
      if (lastScore > firstScore) {
        return {
          icon: "↗",
          text: "Điểm đang tăng",
          color: "text-green-600"
        };
      } else if (lastScore < firstScore) {
        return {
          icon: "↘",
          text: "Điểm đang giảm",
          color: "text-red-600"
        };
      } else {
        return {
          icon: "→",
          text: "Điểm ổn định",
          color: "text-gray-600"
        };
      }
    }
    return null;
  };

  const excellentSemesters = sortedScores.filter(s => s.classification === 'Xuất sắc').length;
  const trendAnalysis = getTrendAnalysis();

  return (
    <Card title="Phân tích hiệu suất" className="mb-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Xu hướng</h4>
            {trendAnalysis ? (
              <div className={trendAnalysis.color}>
                <span className="text-2xl">{trendAnalysis.icon}</span>
                <p>{trendAnalysis.text}</p>
              </div>
            ) : (
              <p className="text-gray-500">Cần ít nhất 2 học kỳ để phân tích</p>
            )}
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800 mb-2">Thành tích</h4>
            <div className="text-green-600">
              <span className="text-2xl font-bold">{excellentSemesters}</span>
              <p>Học kỳ xuất sắc</p>
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">Mục tiêu</h4>
            <div className="text-yellow-600">
              <span className="text-2xl font-bold">90+</span>
              <p>Điểm mục tiêu</p>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
} 