'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, Row, Col, Table, Select } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Loading from '../Loading';
import StatsOverview from './StatsOverview';

const { Option } = Select;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Class {
  id: number;
  name: string;
}

interface ClassStats {
  class_name: string;
  faculty_abbr: string;
  average_score: number;
  total_students: number;
  excellent_count: number;
  good_count: number;
  fair_count: number;
  average_count: number;
  poor_count: number;
}

interface StudentDetail {
  student_id: string;
  full_name: string;
  score: number;
  classification: string;
}

interface AdvisorClassStatsProps {
  selectedSemester: string;
  advisorId: number | null;
  advisorClasses: Class[];
}

export default function AdvisorClassStats({ selectedSemester, advisorId, advisorClasses }: AdvisorClassStatsProps) {
  const [loading, setLoading] = useState(true);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [studentDetails, setStudentDetails] = useState<StudentDetail[]>([]);
  const [currentClassStats, setCurrentClassStats] = useState<ClassStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        let endpoint = '';

        if (selectedSemester === 'all') {
          endpoint = `/api/student-scores/advisor/${advisorId}/stats/class/all`;
        } else {
          const [semesterNo, academicYear] = selectedSemester.split('_');
          endpoint = `/api/student-scores/advisor/${advisorId}/stats/class/${semesterNo}/${academicYear}`;
        }

        const response = await api.get(endpoint);
        if (response.data?.data) {
          setClassStats(response.data.data.classes || []);
          setSelectedClass('all');
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setClassStats([]);
      } finally {
        setLoading(false);
      }
    };

    if (advisorId) {
      fetchStats();
    }
  }, [selectedSemester, advisorId]);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (selectedClass === 'all') {
        setStudentDetails([]);
        setCurrentClassStats(null);
        return;
      }

      try {
        setLoading(true);
        let endpoint = '';

        if (selectedSemester === 'all') {
          endpoint = `/api/student-scores/advisor/${advisorId}/stats/class/all`;
        } else {
          const [semesterNo, academicYear] = selectedSemester.split('_');
          endpoint = `/api/student-scores/advisor/${advisorId}/stats/class/${semesterNo}/${academicYear}`;
        }

        const response = await api.get(endpoint);
        const classData = response.data.data.classes || [];
        
        // Set current class stats
        const classStats = classData.find((stat: ClassStats) => stat.class_name === selectedClass);
        setCurrentClassStats(classStats || null);

        // Get student details
        let studentEndpoint = `/api/student-scores/class/${selectedClass}`;
        if (selectedSemester !== 'all') {
          const [semesterNo, academicYear] = selectedSemester.split('_').map(Number);
          studentEndpoint = `/api/student-scores/class/${selectedClass}/${semesterNo}/${academicYear}`;
        }
        const studentResponse = await api.get(studentEndpoint);
        setStudentDetails(studentResponse.data.data.students);
      } catch (error) {
        console.error('Error fetching student details:', error);
        setStudentDetails([]);
        setCurrentClassStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [selectedClass, selectedSemester, advisorId]);

  const getPieChartData = () => {
    if (!currentClassStats) return {
      labels: ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          '#4CAF50',
          '#2196F3',
          '#FFC107',
          '#FF9800',
          '#F44336',
        ],
      }],
    };

    return {
      labels: ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'],
      datasets: [{
        data: [
          currentClassStats.excellent_count,
          currentClassStats.good_count,
          currentClassStats.fair_count,
          currentClassStats.average_count,
          currentClassStats.poor_count,
        ],
        backgroundColor: [
          '#4CAF50',
          '#2196F3',
          '#FFC107',
          '#FF9800',
          '#F44336',
        ],
      }],
    };
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: selectedClass === 'all' ? 'Phân bố xếp loại tất cả lớp' : `Phân bố xếp loại lớp ${selectedClass}`,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      }
    }
  };

  const studentColumns = [
    {
      title: 'MSSV',
      dataIndex: 'student_id',
      key: 'student_id',
    },
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => score.toFixed(2),
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      key: 'classification',
    },
  ];

  const classColumns = [
    {
      title: 'Tên lớp',
      dataIndex: 'class_name',
      key: 'class_name',
    },
    {
      title: 'Điểm TB',
      dataIndex: 'average_score',
      key: 'average_score',
      render: (score: string | number) => {
        const numScore = typeof score === 'string' ? parseFloat(score) : score;
        return numScore.toFixed(2);
      },
    },
    {
      title: 'SL Sinh viên',
      key: 'total_students',
      render: (_: unknown, record: ClassStats) => {
        return Number(record.excellent_count) + 
               Number(record.good_count) + 
               Number(record.fair_count) + 
               Number(record.average_count) + 
               Number(record.poor_count);
      },
    },
    {
      title: 'Xuất sắc',
      key: 'excellent_rate',
      render: (_: unknown, record: ClassStats) => {
        const total = Number(record.excellent_count) + 
                     Number(record.good_count) + 
                     Number(record.fair_count) + 
                     Number(record.average_count) + 
                     Number(record.poor_count);
        const rate = total > 0 ? (Number(record.excellent_count) / total) * 100 : 0;
        return `${rate.toFixed(2)}%`;
      },
    },
    {
      title: 'Tốt',
      key: 'good_rate',
      render: (_: unknown, record: ClassStats) => {
        const total = Number(record.excellent_count) + 
                     Number(record.good_count) + 
                     Number(record.fair_count) + 
                     Number(record.average_count) + 
                     Number(record.poor_count);
        const rate = total > 0 ? (Number(record.good_count) / total) * 100 : 0;
        return `${rate.toFixed(2)}%`;
      },
    }
  ];

  const getAverageScoreChartData = () => {
    // Sắp xếp theo điểm trung bình
    const sortedStats = [...classStats].sort((a, b) => {
      const avgA = typeof a.average_score === 'string' ? parseFloat(a.average_score) : a.average_score;
      const avgB = typeof b.average_score === 'string' ? parseFloat(b.average_score) : b.average_score;
      return avgB - avgA;
    });

    return {
      labels: sortedStats.map(stat => stat.class_name),
      datasets: [
        {
          label: 'Điểm trung bình',
          data: sortedStats.map(stat => {
            const avgScore = typeof stat.average_score === 'string' 
              ? parseFloat(stat.average_score) 
              : stat.average_score;
            return Number(avgScore.toFixed(2));
          }),
          backgroundColor: '#2196F3',
        }
      ]
    };
  };

  const averageScoreOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Điểm trung bình theo lớp',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      }
    }
  };

  const getDistributionChartData = () => {
    // Sắp xếp theo tỷ lệ xuất sắc & tốt
    const sortedStats = [...classStats].sort((a, b) => {
      const rateA = ((a.excellent_count + a.good_count) / a.total_students) * 100;
      const rateB = ((b.excellent_count + b.good_count) / b.total_students) * 100;
      return rateB - rateA;
    });

    return {
      labels: sortedStats.map(stat => stat.class_name),
      datasets: [
        {
          label: 'Xuất sắc',
          data: sortedStats.map(stat => {
            const total = stat.total_students;
            return total > 0 ? (stat.excellent_count / total) * 100 : 0;
          }),
          backgroundColor: '#4CAF50',
        },
        {
          label: 'Tốt',
          data: sortedStats.map(stat => {
            const total = stat.total_students;
            return total > 0 ? (stat.good_count / total) * 100 : 0;
          }),
          backgroundColor: '#2196F3',
        },
        {
          label: 'Khá',
          data: sortedStats.map(stat => {
            const total = stat.total_students;
            return total > 0 ? (stat.fair_count / total) * 100 : 0;
          }),
          backgroundColor: '#FFC107',
        },
        {
          label: 'Trung bình',
          data: sortedStats.map(stat => {
            const total = stat.total_students;
            return total > 0 ? (stat.average_count / total) * 100 : 0;
          }),
          backgroundColor: '#FF9800',
        },
        {
          label: 'Yếu',
          data: sortedStats.map(stat => {
            const total = stat.total_students;
            return total > 0 ? (stat.poor_count / total) * 100 : 0;
          }),
          backgroundColor: '#F44336',
        },
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Phân bố xếp loại theo lớp',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      }
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        max: 100,
      }
    }
  };

  const getOverviewData = () => {
    if (!currentClassStats && selectedClass === 'all') {
      // Tính tổng số sinh viên từ tổng các phân loại
      const totalStudents = classStats.reduce((sum, stat) => {
        return sum + 
          Number(stat.excellent_count) + 
          Number(stat.good_count) + 
          Number(stat.fair_count) + 
          Number(stat.average_count) + 
          Number(stat.poor_count);
      }, 0);

      // Tính tổng điểm (điểm TB * số sinh viên của từng lớp)
      const totalScore = classStats.reduce((sum, stat) => {
        const score = typeof stat.average_score === 'string' ? parseFloat(stat.average_score) : stat.average_score;
        const classTotal = Number(stat.excellent_count) + 
                         Number(stat.good_count) + 
                         Number(stat.fair_count) + 
                         Number(stat.average_count) + 
                         Number(stat.poor_count);
        return sum + (score * classTotal);
      }, 0);

      const totalExcellent = classStats.reduce((sum, stat) => sum + Number(stat.excellent_count), 0);
      const totalGood = classStats.reduce((sum, stat) => sum + Number(stat.good_count), 0);
      const totalPoor = classStats.reduce((sum, stat) => sum + Number(stat.poor_count), 0);

      return {
        totalStudents,
        averageScore: totalStudents > 0 ? totalScore / totalStudents : 0,
        excellentGoodRate: totalStudents > 0 ? ((totalExcellent + totalGood) * 100) / totalStudents : 0,
        poorCount: totalPoor
      };
    }

    if (currentClassStats) {
      const total = Number(currentClassStats.excellent_count) + 
                   Number(currentClassStats.good_count) + 
                   Number(currentClassStats.fair_count) + 
                   Number(currentClassStats.average_count) + 
                   Number(currentClassStats.poor_count);

      return {
        totalStudents: total,
        averageScore: currentClassStats.average_score,
        excellentGoodRate: ((Number(currentClassStats.excellent_count) + Number(currentClassStats.good_count)) * 100) / total,
        poorCount: Number(currentClassStats.poor_count)
      };
    }

    return {
      totalStudents: 0,
      averageScore: 0,
      excellentGoodRate: 0,
      poorCount: 0
    };
  };

  if (loading) {
    return <Loading />;
  }

  // Filter stats to only show advisor's classes
  const advisorClassNames = advisorClasses.map(cls => cls.name);
  const filteredClassStats = classStats.filter(stat => 
    advisorClassNames.includes(stat.class_name)
  );

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="mb-4">
            <span className="mr-2">Lớp:</span>
            <Select 
              value={selectedClass} 
              onChange={setSelectedClass} 
              style={{ width: 200 }}
            >
              <Option value="all">Tất cả các lớp</Option>
              {filteredClassStats.map(stat => (
                <Option key={stat.class_name} value={stat.class_name}>
                  {stat.class_name}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
      </Row>

      <StatsOverview key={`overview-${selectedClass}`} {...getOverviewData()} />

      {selectedClass === 'all' ? (
        <>
          <Row gutter={[16, 16]} className="mt-6">
            <Col span={24}>
              <Card title="Danh sách lớp">
                <Table 
                  dataSource={filteredClassStats} 
                  columns={classColumns}
                  pagination={false}
                  rowKey="class_name"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mt-6">
            <Col span={12}>
              <Card title="Điểm trung bình theo lớp" className="h-[500px]">
                <div style={{ height: '400px' }}>
                  <Bar key={`avg-chart-${selectedClass}`} data={getAverageScoreChartData()} options={averageScoreOptions} />
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Chi tiết xếp loại theo lớp" className="h-[500px]">
                <div style={{ height: '400px' }}>
                  <Bar key={`dist-chart-${selectedClass}`} data={getDistributionChartData()} options={chartOptions} />
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <>
          <Row gutter={[16, 16]} className="mt-6">
            <Col span={12}>
              <Card title="Danh sách sinh viên">
                <Table 
                  dataSource={studentDetails} 
                  columns={studentColumns}
                  pagination={false}
                  rowKey="student_id"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Phân bố xếp loại" className="h-[500px]">
                <div style={{ height: '400px' }}>
                  <Pie key={`pie-chart-${selectedClass}`} data={getPieChartData()} options={pieOptions} />
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
} 