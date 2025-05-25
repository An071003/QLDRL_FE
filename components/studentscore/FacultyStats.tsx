'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table } from 'antd';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import api from '@/lib/api';
import StatsOverview from './StatsOverview';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface Faculty {
  id: number;
  name: string;
  faculty_abbr: string;
}

interface StudentDetail {
  id: string;
  name: string;
  studentId: string;
  class: string;
  faculty: string;
  score: number;
}

interface FacultyStatsProps {
  selectedSemester: string;
  selectedFaculty: string;
  faculties: Faculty[];
  statsEndpoint: string;
}

interface StatsData {
  total_students: number;
  average_score: string | number;
  excellent_count: string | number;
  good_count: string | number;
  fair_count: string | number;
  average_count: string | number;
  poor_count: string | number;
}

interface ClassStats {
  class_name: string;
  faculty_abbr: string;
  faculty_name?: string;
  average_score: string | number;
  student_count: number;
  excellent_count: string | number;
  good_count: string | number;
  fair_count: string | number;
  average_count: string | number;
  poor_count: string | number;
}

interface FacultyStats extends ClassStats {
  id: number;
  faculty_name: string;
  high_achieving_rate: number;
}

interface PieChartStats {
  excellent_count: string | number;
  good_count: string | number;
  fair_count: string | number;
  average_count: string | number;
  poor_count: string | number;
}

export default function FacultyStats({ 
  selectedSemester,
  selectedFaculty,
  faculties,
  statsEndpoint
}: FacultyStatsProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [facultyStats, setFacultyStats] = useState<FacultyStats[]>([]);
  const [selectedFacultyLocal, setSelectedFacultyLocal] = useState<string>('all');
  const [studentDetails, setStudentDetails] = useState<StudentDetail[]>([]);
  const [currentFacultyStats, setCurrentFacultyStats] = useState<FacultyStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch faculty stats
        const facultyResponse = await api.get(statsEndpoint);
        const facultyData = facultyResponse.data.data;
        
        // Set overall stats from the response
        const overallStats = {
          ...facultyData.overall,
          total_students: Number(facultyData.overall.total_students),
          excellent_count: Number(facultyData.overall.excellent_count),
          good_count: Number(facultyData.overall.good_count),
          fair_count: Number(facultyData.overall.fair_count),
          average_count: Number(facultyData.overall.average_count),
          poor_count: Number(facultyData.overall.poor_count)
        };
        setStats(overallStats);

        // Set faculty stats
        const processedFacultyStats = facultyData.faculties.map((faculty: any) => ({
          ...faculty,
          total_students: Number(faculty.total_students),
          excellent_count: Number(faculty.excellent_count),
          good_count: Number(faculty.good_count),
          fair_count: Number(faculty.fair_count),
          average_count: Number(faculty.average_count),
          poor_count: Number(faculty.poor_count),
          high_achieving_rate: ((Number(faculty.excellent_count) + Number(faculty.good_count)) / Number(faculty.total_students)) * 100
        }));
        setFacultyStats(processedFacultyStats);

        // Fetch class stats
        let classEndpoint = '/api/student-scores/stats/class/all';
        if (selectedSemester !== 'all') {
          const [semesterNo, academicYear] = selectedSemester.split('_').map(Number);
          classEndpoint = `/api/student-scores/stats/class/${semesterNo}/${academicYear}`;
        }
        const classResponse = await api.get(classEndpoint);
        let classData = classResponse.data.data.classes;

        // Filter class stats if faculty is selected
        if (selectedFaculty !== 'all') {
          const selectedFacultyData = faculties.find(f => f.id.toString() === selectedFaculty);
          if (selectedFacultyData) {
            classData = classData.filter(
              (stat: ClassStats) => stat.faculty_abbr === selectedFacultyData.faculty_abbr
            );
          }
        }
        setClassStats(classData);

      } catch (error) {
        setStats({
          total_students: 0,
          average_score: 0,
          excellent_count: 0,
          good_count: 0,
          fair_count: 0,
          average_count: 0,
          poor_count: 0
        });
        setClassStats([]);
        setFacultyStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [statsEndpoint, selectedFaculty, faculties, selectedSemester]);

  const getPieChartData = () => {
    if (!stats) return {
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

    let displayStats: PieChartStats;

    if (selectedFaculty !== 'all') {
      const selectedFacultyId = Number(selectedFaculty);
      const selectedFacultyData = faculties.find(f => f.id === selectedFacultyId);

      if (selectedFacultyData) {
        const facultyClassStats = classStats.filter(
          stat => stat.faculty_abbr === selectedFacultyData.faculty_abbr
        );
        
        displayStats = {
          excellent_count: facultyClassStats.reduce((sum, stat) => sum + Number(stat.excellent_count || 0), 0),
          good_count: facultyClassStats.reduce((sum, stat) => sum + Number(stat.good_count || 0), 0),
          fair_count: facultyClassStats.reduce((sum, stat) => sum + Number(stat.fair_count || 0), 0),
          average_count: facultyClassStats.reduce((sum, stat) => sum + Number(stat.average_count || 0), 0),
          poor_count: facultyClassStats.reduce((sum, stat) => sum + Number(stat.poor_count || 0), 0)
        };
      } else {
        displayStats = {
          excellent_count: 0,
          good_count: 0,
          fair_count: 0,
          average_count: 0,
          poor_count: 0
        };
      }
    } else {
      displayStats = {
        excellent_count: Number(stats.excellent_count),
        good_count: Number(stats.good_count),
        fair_count: Number(stats.fair_count),
        average_count: Number(stats.average_count),
        poor_count: Number(stats.poor_count)
      };
    }

    const data = {
      labels: ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'],
      datasets: [{
        data: [
          Number(displayStats.excellent_count),
          Number(displayStats.good_count),
          Number(displayStats.fair_count),
          Number(displayStats.average_count),
          Number(displayStats.poor_count)
        ],
        backgroundColor: [
          '#4CAF50', // Xuất sắc - Xanh lá
          '#2196F3', // Tốt - Xanh dương
          '#FFC107', // Khá - Vàng
          '#FF9800', // Trung bình - Cam
          '#F44336', // Yếu - Đỏ
        ],
      }],
    };
    return data;
  };

  const getFacultyName = () => {
    if (selectedFaculty === 'all') return 'toàn trường';
    const faculty = faculties.find(f => f.id.toString() === selectedFaculty);
    return faculty ? faculty.name : '';
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: `Phân bố xếp loại ${getFacultyName()}`,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  const getTopItems = () => {
    if (selectedFaculty === 'all') {
      // Top 3 khoa có tỷ lệ SV xuất sắc & tốt cao nhất
      return facultyStats
        .sort((a, b) => b.high_achieving_rate - a.high_achieving_rate)
        .slice(0, 3);
    } else {
      // Top 3 lớp có điểm TB cao nhất của khoa được chọn
      const selectedFacultyData = faculties.find(f => f.id === parseInt(selectedFaculty));
      const filteredClasses = selectedFacultyData
        ? classStats.filter(stat => stat.faculty_abbr === selectedFacultyData.faculty_abbr)
        : [];
      
      return filteredClasses
        .sort((a, b) => {
          const scoreA = typeof a.average_score === 'string' ? parseFloat(a.average_score) : a.average_score;
          const scoreB = typeof b.average_score === 'string' ? parseFloat(b.average_score) : b.average_score;
          return scoreB - scoreA;
        })
        .slice(0, 3);
    }
  };

  const getFacultyColumns = [
    {
      title: 'Tên khoa',
      dataIndex: 'faculty_name',
      key: 'faculty_name',
      width: '40%',
    },
    {
      title: 'Điểm TB',
      dataIndex: 'average_score',
      key: 'average_score',
      width: '20%',
      render: (score: number | string) => {
        const numScore = typeof score === 'string' ? parseFloat(score) : score;
        return numScore.toFixed(2);
      },
    },
    {
      title: 'SL Sinh viên',
      dataIndex: 'total_students',
      key: 'total_students',
      width: '20%',
      render: (value: any) => Number(value),
    },
    {
      title: 'Tỷ lệ XS & Tốt',
      dataIndex: 'high_achieving_rate',
      key: 'high_achieving_rate',
      width: '20%',
      render: (rate: number) => `${(Number(rate)).toFixed(2)}%`,
    },
  ];

  const getClassColumns = [
    {
      title: 'Tên lớp',
      dataIndex: 'class_name',
      key: 'class_name',
      width: '40%',
    },
    {
      title: 'Điểm TB',
      dataIndex: 'average_score',
      key: 'average_score',
      width: '20%',
      render: (score: number | string) => {
        const numScore = typeof score === 'string' ? parseFloat(score) : score;
        return numScore.toFixed(2);
      },
    },
    {
      title: 'SL Sinh viên',
      dataIndex: 'total_students',
      key: 'total_students',
      width: '20%',
      render: (value: any) => Number(value),
    },
    {
      title: 'Xuất sắc',
      key: 'excellent_rate',
      width: '20%',
      render: (text: any, record: ClassStats) => {
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
      width: '20%',
      render: (text: any, record: ClassStats) => {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  const getOverviewData = () => {
    if (!stats || stats.total_students === 0) return {
      totalStudents: 0,
      averageScore: 0,
      excellentGoodRate: 0,
      poorCount: 0
    };

    if (selectedFaculty === 'all') {
      return {
        totalStudents: stats.total_students,
        averageScore: stats.average_score,
        excellentGoodRate: ((Number(stats.excellent_count) + Number(stats.good_count)) * 100) / stats.total_students,
        poorCount: stats.poor_count
      };
    }

    const selectedFacultyData = faculties.find(f => f.id === parseInt(selectedFaculty));
    if (!selectedFacultyData) return {
      totalStudents: 0,
      averageScore: 0,
      excellentGoodRate: 0,
      poorCount: 0
    };

    const facultyClasses = classStats.filter(stat => stat.faculty_abbr === selectedFacultyData.faculty_abbr);
    const excellent = facultyClasses.reduce((sum, stat) => sum + Number(stat.excellent_count), 0);
    const good = facultyClasses.reduce((sum, stat) => sum + Number(stat.good_count), 0);
    const total = facultyClasses.reduce((sum, stat) => {
      return sum + 
        Number(stat.excellent_count) + 
        Number(stat.good_count) + 
        Number(stat.fair_count) + 
        Number(stat.average_count) + 
        Number(stat.poor_count);
    }, 0);
    const poor = facultyClasses.reduce((sum, stat) => sum + Number(stat.poor_count), 0);
    const avgScore = facultyClasses.reduce((sum, stat) => {
      const score = typeof stat.average_score === 'string' ? parseFloat(stat.average_score) : stat.average_score;
      return sum + score;
    }, 0) / facultyClasses.length;

    return {
      totalStudents: total,
      averageScore: avgScore,
      excellentGoodRate: total > 0 ? ((excellent + good) * 100) / total : 0,
      poorCount: poor
    };
  };

  const getAverageScoreChartData = () => {
    let items;
    if (selectedFaculty === 'all') {
      items = facultyStats;
    } else {
      // Lọc lớp theo khoa được chọn
      const selectedFacultyData = faculties.find(f => f.id === parseInt(selectedFaculty));
      items = selectedFacultyData 
        ? classStats.filter(stat => stat.faculty_abbr === selectedFacultyData.faculty_abbr)
        : [];
    }

    const labels = items.map(item => 
      selectedFaculty === 'all' ? item.faculty_name : item.class_name
    );

    return {
      labels,
      datasets: [
        {
          label: 'Điểm trung bình',
          data: items.map(item => typeof item.average_score === 'string' ? parseFloat(item.average_score) : item.average_score),
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
        text: selectedFaculty === 'all' 
          ? 'Điểm trung bình theo khoa' 
          : 'Điểm trung bình theo lớp',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Điểm'
        }
      }
    }
  };

  const getBarChartData = () => {
    let items;
    if (selectedFaculty === 'all') {
      items = facultyStats;
    } else {
      // Lọc lớp theo khoa được chọn
      const selectedFacultyData = faculties.find(f => f.id === parseInt(selectedFaculty));
      items = selectedFacultyData 
        ? classStats.filter(stat => stat.faculty_abbr === selectedFacultyData.faculty_abbr)
        : [];
    }

    const labels = items.map(item => 
      selectedFaculty === 'all' ? item.faculty_name : item.class_name
    );

    return {
      labels,
      datasets: [
        {
          label: 'Xuất sắc',
          data: items.map(item => Number(item.excellent_count) || 0),
          backgroundColor: '#4CAF50',
        },
        {
          label: 'Tốt',
          data: items.map(item => Number(item.good_count) || 0),
          backgroundColor: '#2196F3',
        },
        {
          label: 'Khá',
          data: items.map(item => Number(item.fair_count) || 0),
          backgroundColor: '#FFC107',
        },
        {
          label: 'Trung bình',
          data: items.map(item => Number(item.average_count) || 0),
          backgroundColor: '#FF9800',
        },
        {
          label: 'Yếu',
          data: items.map(item => Number(item.poor_count) || 0),
          backgroundColor: '#F44336',
        },
      ],
    };
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: selectedFaculty === 'all' 
          ? 'Phân bố xếp loại theo khoa' 
          : 'Phân bố xếp loại theo lớp',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            if (value === null || value === 0) return '';
            return `${context.dataset.label}: ${Math.round(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (Math.floor(value) === value) {
              return value;
            }
            return null;
          }
        }
      },
    },
  };

  return (
    <div>
      <StatsOverview {...getOverviewData()} />

      <Row gutter={[16, 16]} className="mt-6">
        <Col span={12}>
          <Card title="Phân bố điểm rèn luyện" className="h-[400px]">
            <div style={{ height: '300px' }}>
              <Pie data={getPieChartData()} options={pieOptions} />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={selectedFaculty === 'all' ? 'Top 3 khoa có tỷ lệ SV xuất sắc & tốt cao nhất' : 'Top 3 lớp có điểm cao nhất'}
            className="overflow-x-auto"
          >
            <Table 
              dataSource={getTopItems()} 
              columns={selectedFaculty === 'all' ? getFacultyColumns : getClassColumns} 
              pagination={false}
              rowKey={selectedFaculty === 'all' ? 'faculty_abbr' : 'class_name'}
              size="middle"
              bordered
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col span={12}>
          <Card title={selectedFaculty === 'all' ? 'Điểm trung bình theo khoa' : 'Điểm trung bình theo lớp'} className="h-[500px]">
            <div style={{ height: '400px' }}>
              <Bar data={getAverageScoreChartData()} options={averageScoreOptions} />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={selectedFaculty === 'all' ? 'Chi tiết xếp loại theo khoa' : 'Chi tiết xếp loại theo lớp'} className="h-[500px]">
            <div style={{ height: '400px' }}>
              <Bar data={getBarChartData()} options={barOptions} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 