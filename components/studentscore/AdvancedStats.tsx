import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Card, Select, Tabs, Row, Col, Statistic } from 'antd';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const { Option } = Select;
const { TabPane } = Tabs;

interface StatData {
  faculty_abbr?: string;
  faculty_name?: string;
  class_name?: string;
  academic_year?: number;
  average_score: number;
  student_count: number;
  excellent_count: number;
  good_count: number;
  fair_count: number;
  average_count: number;
  poor_count: number;
}

interface AdvancedStatsProps {
  semesterNo?: number | null;
  academicYear?: number | null;
  selectedSemester: string;
}

export default function AdvancedStats({ semesterNo, academicYear, selectedSemester }: AdvancedStatsProps) {
  const [facultyStats, setFacultyStats] = useState<StatData[]>([]);
  const [classStats, setClassStats] = useState<StatData[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'faculty' | 'class'>('faculty');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [facultyRes, classRes] = await Promise.all([
          api.get(`/api/student-scores/stats/faculty/${semesterNo}/${academicYear}`),
          api.get(`/api/student-scores/stats/class/${semesterNo}/${academicYear}`)
        ]);
        setFacultyStats(facultyRes.data.data.stats);
        setClassStats(classRes.data.data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [semesterNo, academicYear]);

  const getStackedBarData = (data: StatData[]) => ({
    labels: data.map(d => d.faculty_abbr || d.class_name || ''),
    datasets: [
      {
        label: 'Xuất sắc',
        data: data.map(d => d.excellent_count),
        backgroundColor: '#4caf50',
      },
      {
        label: 'Tốt',
        data: data.map(d => d.good_count),
        backgroundColor: '#2196f3',
      },
      {
        label: 'Khá',
        data: data.map(d => d.fair_count),
        backgroundColor: '#ffc107',
      },
      {
        label: 'Trung bình',
        data: data.map(d => d.average_count),
        backgroundColor: '#ff9800',
      },
      {
        label: 'Yếu',
        data: data.map(d => d.poor_count),
        backgroundColor: '#f44336',
      },
    ]
  });

  const getAverageScoreData = (data: StatData[]) => ({
    labels: data.map(d => d.faculty_abbr || d.class_name || ''),
    datasets: [
      {
        label: 'Điểm trung bình',
        data: data.map(d => d.average_score),
        borderColor: '#2196f3',
        backgroundColor: '#bbdefb',
      }
    ]
  });

  const getPieData = (data: StatData) => ({
    labels: ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'],
    datasets: [
      {
        data: [
          data.excellent_count,
          data.good_count,
          data.fair_count,
          data.average_count,
          data.poor_count,
        ],
        backgroundColor: [
          '#4caf50',
          '#2196f3',
          '#ffc107',
          '#ff9800',
          '#f44336',
        ],
      }
    ]
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
      },
      x: {
        stacked: true,
      }
    }
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Điểm trung bình'
        }
      }
    }
  };

  const currentStats = selectedView === 'faculty' ? facultyStats : 
    (selectedFaculty ? classStats.filter(stat => stat.faculty_abbr === selectedFaculty) : classStats);

  const totalStudents = currentStats.reduce((sum, stat) => sum + stat.student_count, 0);
  const totalExcellent = currentStats.reduce((sum, stat) => sum + stat.excellent_count, 0);
  const totalGood = currentStats.reduce((sum, stat) => sum + stat.good_count, 0);
  const totalFair = currentStats.reduce((sum, stat) => sum + stat.fair_count, 0);
  const averageScore = currentStats.reduce((sum, stat) => sum + stat.average_score * stat.student_count, 0) / totalStudents;

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <Select
          style={{ width: 200 }}
          value={selectedView}
          onChange={setSelectedView}
        >
          <Option value="faculty">Theo khoa</Option>
          <Option value="class">Theo lớp</Option>
        </Select>

        {selectedView === 'class' && (
          <Select
            style={{ width: 200 }}
            value={selectedFaculty}
            onChange={setSelectedFaculty}
            allowClear
            placeholder="Chọn khoa"
          >
            {facultyStats.map(stat => (
              <Option key={stat.faculty_abbr} value={stat.faculty_abbr}>
                {stat.faculty_name}
              </Option>
            ))}
          </Select>
        )}
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số sinh viên"
              value={totalStudents}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={averageScore}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Xuất sắc & Tốt"
              value={totalExcellent + totalGood}
              suffix={`/ ${totalStudents}`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tỷ lệ đạt khá trở lên"
              value={((totalExcellent + totalGood + totalFair) / totalStudents * 100)}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Phân bố xếp loại" key="1">
          <Card>
            <Bar 
              options={chartOptions} 
              data={getStackedBarData(currentStats)} 
            />
          </Card>
        </TabPane>
        
        <TabPane tab="Điểm trung bình" key="2">
          <Card>
            <Line 
              options={lineChartOptions} 
              data={getAverageScoreData(currentStats)} 
            />
          </Card>
        </TabPane>

        {selectedView === 'faculty' && facultyStats.map(faculty => (
          <TabPane tab={faculty.faculty_name} key={`faculty-${faculty.faculty_abbr}`}>
            <Card title={`Tỷ lệ xếp loại - ${faculty.faculty_name}`}>
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <Pie data={getPieData(faculty)} />
              </div>
            </Card>
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
} 