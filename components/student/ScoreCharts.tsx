import { Card, Row, Col, Tabs, Empty, Spin } from "antd";
import { LineChartOutlined, BarChartOutlined, PieChartOutlined } from "@ant-design/icons";
import dynamic from 'next/dynamic';

// Dynamic imports for Chart.js to avoid SSR issues
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Spin /></div>
});

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Spin /></div>
});

const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Spin /></div>
});

interface StudentScore {
  student_id: string;
  semester_no: number;
  academic_year: number;
  score: number;
  classification: string;
  status: 'none' | 'disciplined';
}

interface ScoreChartsProps {
  scores: StudentScore[];
  chartReady: boolean;
}

export default function ScoreCharts({ scores, chartReady }: ScoreChartsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#faad14';
    if (score >= 80) return '#52c41a';
    if (score >= 65) return '#1890ff';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  // Sort scores by year and semester correctly (ascending order: HK1 before HK2)
  const sortedScores = [...scores].sort((a, b) => {
    if (a.academic_year !== b.academic_year) {
      return a.academic_year - b.academic_year;
    }
    return a.semester_no - b.semester_no;
  });

  // Chart data
  const lineChartData = {
    labels: sortedScores.map(score => `HK${score.semester_no}/${score.academic_year}`),
    datasets: [
      {
        label: 'Điểm rèn luyện',
        data: sortedScores.map(score => score.score),
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barChartData = {
    labels: sortedScores.map(score => `HK${score.semester_no}/${score.academic_year}`),
    datasets: [
      {
        label: 'Điểm rèn luyện',
        data: sortedScores.map(score => score.score),
        backgroundColor: sortedScores.map(score => getScoreColor(score.score)),
        borderColor: sortedScores.map(score => getScoreColor(score.score)),
        borderWidth: 1,
      },
    ],
  };

  // Classification distribution
  const classificationCounts = scores.reduce((acc, score) => {
    acc[score.classification] = (acc[score.classification] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = {
    labels: Object.keys(classificationCounts),
    datasets: [
      {
        data: Object.values(classificationCounts),
        backgroundColor: [
          '#faad14', // Xuất sắc
          '#52c41a', // Giỏi
          '#1890ff', // Khá
          '#fa8c16', // Trung bình
          '#f5222d', // Yếu
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Điểm',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const totalSemesters = scores.length;
  const highestScore = totalSemesters > 0 
    ? Math.max(...scores.map(score => score.score)) 
    : 0;
  const lowestScore = totalSemesters > 0 
    ? Math.min(...scores.map(score => score.score)) 
    : 0;

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <LineChartOutlined />
          Biểu đồ đường
        </span>
      ),
      children: (
        <Card title="Xu hướng điểm rèn luyện theo học kỳ">
          {sortedScores.length > 0 && chartReady ? (
            <div style={{ height: '400px' }}>
              <Line data={lineChartData} options={chartOptions} />
            </div>
          ) : (
            <Empty description="Không có dữ liệu điểm" />
          )}
        </Card>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <BarChartOutlined />
          Biểu đồ cột
        </span>
      ),
      children: (
        <Card title="Điểm rèn luyện theo học kỳ">
          {sortedScores.length > 0 && chartReady ? (
            <div style={{ height: '400px' }}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          ) : (
            <Empty description="Không có dữ liệu điểm" />
          )}
        </Card>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <PieChartOutlined />
          Phân bố xếp loại
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Phân bố xếp loại">
              {Object.keys(classificationCounts).length > 0 && chartReady ? (
                <div style={{ height: '300px' }}>
                  <Pie data={pieChartData} options={pieOptions} />
                </div>
              ) : (
                <Empty description="Không có dữ liệu xếp loại" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Thống kê chi tiết">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Tổng số học kỳ:</span>
                  <span className="font-bold text-blue-600">{totalSemesters}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Điểm cao nhất:</span>
                  <span className="font-bold text-yellow-600">{highestScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Điểm thấp nhất:</span>
                  <span className="font-bold text-red-600">{lowestScore.toFixed(1)}</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return <Tabs defaultActiveKey="1" items={tabItems} className="mb-6" />;
} 