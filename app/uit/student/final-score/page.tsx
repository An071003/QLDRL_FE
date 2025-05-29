'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Select, Statistic, Progress, Alert, Empty, Spin, Tag, Tabs } from 'antd';
import { TrophyOutlined, CalendarOutlined, BookOutlined, LineChartOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { StudentLayout } from '@/components/layout/student';
import api from '@/lib/api';
import { toast } from 'sonner';
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

const { Option } = Select;

interface StudentScore {
  student_id: string;
  semester_no: number;
  academic_year: number;
  score: number;
  classification: string;
  status: 'none' | 'disciplined';
}

interface StudentProfile {
  student_id: string;
  student_name: string;
  classification?: string;
  sumscore: number;
  Faculty?: {
    name: string;
    faculty_abbr: string;
  };
  Class?: {
    name: string;
  };
}

interface StudentSummary {
  sumscore: number;
  classification: string;
}

export default function FinalScorePage() {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    fetchData();
    // Initialize Chart.js
    initializeChart();
  }, []);

  const initializeChart = async () => {
    try {
      const ChartJS = await import('chart.js');
      ChartJS.Chart.register(
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.BarElement,
        ChartJS.LineElement,
        ChartJS.PointElement,
        ChartJS.ArcElement,
        ChartJS.Title,
        ChartJS.Tooltip,
        ChartJS.Legend
      );
      setChartReady(true);
    } catch (error) {
      console.error('Error initializing Chart.js:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch student profile
      const profileResponse = await api.get('/api/students/me');
      if (profileResponse.data?.status === "success" && profileResponse.data?.data?.student) {
        setProfile(profileResponse.data.data.student);
      } else {
        // Fallback demo data
        setProfile({
          student_id: "21520001",
          student_name: "Nguyễn Văn A",
          classification: "Giỏi",
          sumscore: 85.5,
          Faculty: { name: "Công nghệ thông tin", faculty_abbr: "CNTT" },
          Class: { name: "21CNTT1" }
        });
        setIsDemoMode(true);
      }

      // Fetch student summary
      const summaryResponse = await api.get('/api/students/me/summary');
      if (summaryResponse.data?.status === "success" && summaryResponse.data?.data) {
        setSummary(summaryResponse.data.data);
      } else {
        setSummary({ sumscore: 85.5, classification: "Giỏi" });
      }

      // Fetch student scores
      const scoresResponse = await api.get('/api/students/me/scores');
      if (scoresResponse.data?.status === "success" && scoresResponse.data?.data?.scores) {
        setScores(scoresResponse.data.data.scores);
      } else {
        // Fallback demo scores
        const demoScores: StudentScore[] = [
          { student_id: "21520001", semester_no: 1, academic_year: 2023, score: 88.5, classification: "Giỏi", status: 'none' },
          { student_id: "21520001", semester_no: 2, academic_year: 2023, score: 82.0, classification: "Giỏi", status: 'none' },
          { student_id: "21520001", semester_no: 1, academic_year: 2024, score: 90.5, classification: "Xuất sắc", status: 'none' },
          { student_id: "21520001", semester_no: 2, academic_year: 2024, score: 85.0, classification: "Giỏi", status: 'none' },
        ];
        setScores(demoScores);
        setIsDemoMode(true);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      // Use demo data on error
      setProfile({
        student_id: "21520001",
        student_name: "Nguyễn Văn A",
        classification: "Giỏi",
        sumscore: 85.5,
        Faculty: { name: "Công nghệ thông tin", faculty_abbr: "CNTT" },
        Class: { name: "21CNTT1" }
      });
      setSummary({ sumscore: 85.5, classification: "Giỏi" });
      const demoScores: StudentScore[] = [
        { student_id: "21520001", semester_no: 1, academic_year: 2023, score: 88.5, classification: "Giỏi", status: 'none' },
        { student_id: "21520001", semester_no: 2, academic_year: 2023, score: 82.0, classification: "Giỏi", status: 'none' },
        { student_id: "21520001", semester_no: 1, academic_year: 2024, score: 90.5, classification: "Xuất sắc", status: 'none' },
        { student_id: "21520001", semester_no: 2, academic_year: 2024, score: 85.0, classification: "Giỏi", status: 'none' },
      ];
      setScores(demoScores);
      setIsDemoMode(true);
      toast.error("Đang sử dụng dữ liệu demo - Lỗi kết nối API");
    } finally {
      setLoading(false);
    }
  };

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

  const getProgressColor = (score: number) => {
    if (score >= 90) return '#faad14';
    if (score >= 80) return '#52c41a';
    if (score >= 65) return '#1890ff';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  // Filter scores by year
  const filteredScores = selectedYear === 'all' 
    ? scores 
    : scores.filter(score => score.academic_year.toString() === selectedYear);

  // Sort scores by year and semester correctly (ascending order: HK1 before HK2)
  const sortedScores = [...filteredScores].sort((a, b) => {
    if (a.academic_year !== b.academic_year) {
      return a.academic_year - b.academic_year;
    }
    return a.semester_no - b.semester_no;
  });

  // Get unique years
  const years = [...new Set(scores.map(score => score.academic_year))].sort((a, b) => b - a);

  // Statistics calculations
  const totalSemesters = filteredScores.length;
  const highestScore = totalSemesters > 0 
    ? Math.max(...filteredScores.map(score => score.score)) 
    : 0;
  const lowestScore = totalSemesters > 0 
    ? Math.min(...filteredScores.map(score => score.score)) 
    : 0;

  // Chart data - use sorted scores
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
  const classificationCounts = filteredScores.reduce((acc, score) => {
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

  const columns = [
    {
      title: 'Học kỳ',
      key: 'semester',
      render: (record: StudentScore) => `HK${record.semester_no}/${record.academic_year}`,
      sorter: (a: StudentScore, b: StudentScore) => {
        if (a.academic_year !== b.academic_year) {
          return b.academic_year - a.academic_year;
        }
        return b.semester_no - a.semester_no;
      },
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <span style={{ color: getScoreColor(score), fontWeight: 'bold' }}>
          {score.toFixed(1)}
        </span>
      ),
      sorter: (a: StudentScore, b: StudentScore) => b.score - a.score,
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      key: 'classification',
      render: (classification: string) => (
        <Tag color={getClassificationColor(classification)}>
          {classification}
        </Tag>
      ),
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (record: StudentScore) => (
        <Progress
          percent={record.score}
          size="small"
          strokeColor={getProgressColor(record.score)}
          showInfo={false}
        />
      ),
    },
  ];

  // Tab items for new Tabs API
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

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </StudentLayout>
    );
  }

  const currentScore = summary?.sumscore || profile?.sumscore || 0;
  const currentClassification = summary?.classification || profile?.classification || 'Chưa xếp loại';

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Thống kê điểm rèn luyện</h1>
          <p className="text-gray-600">Xem chi tiết và phân tích điểm rèn luyện của bạn</p>
        </div>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <Alert
            message="Chế độ Demo"
            description="Bạn đang xem dữ liệu demo. Vui lòng đăng nhập với tài khoản sinh viên để xem thông tin thực."
            type="warning"
            showIcon
            className="mb-6"
            closable
          />
        )}

        {/* Header Stats */}
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

        {/* Filter */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <span className="font-medium">Năm học:</span>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 200 }}
            >
              <Option value="all">Tất cả năm học</Option>
              {years.map(year => (
                <Option key={year} value={year.toString()}>
                  {year}-{year + 1}
                </Option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Charts and Table */}
        <Tabs defaultActiveKey="1" items={tabItems} className="mb-6" />

        {/* Score History Table */}
        <Card title="Lịch sử điểm rèn luyện" className="mb-6">
          {sortedScores.length > 0 ? (
            <Table
              dataSource={sortedScores}
              columns={columns}
              rowKey={(record) => `${record.academic_year}_${record.semester_no}`}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} học kỳ`,
              }}
            />
          ) : (
            <Empty description="Không có dữ liệu điểm" />
          )}
        </Card>

        {/* Performance Analysis */}
        <Card title="Phân tích hiệu suất" className="mb-6">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Xu hướng</h4>
                {sortedScores.length >= 2 ? (
                  <div>
                    {sortedScores[sortedScores.length - 1].score > sortedScores[0].score ? (
                      <div className="text-green-600">
                        <span className="text-2xl">↗</span>
                        <p>Điểm đang tăng</p>
                      </div>
                    ) : sortedScores[sortedScores.length - 1].score < sortedScores[0].score ? (
                      <div className="text-red-600">
                        <span className="text-2xl">↘</span>
                        <p>Điểm đang giảm</p>
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        <span className="text-2xl">→</span>
                        <p>Điểm ổn định</p>
                      </div>
                    )}
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
                  <span className="text-2xl font-bold">
                    {sortedScores.filter(s => s.classification === 'Xuất sắc').length}
                  </span>
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
      </div>
    </StudentLayout>
  );
}