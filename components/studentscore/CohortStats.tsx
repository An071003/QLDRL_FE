'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import StatsOverview from './StatsOverview';
import PieChart from './PieChart';

interface CohortBatch {
  cohort: string;
  total_students: number;
  average_score: number;
  excellent_count: string;
  good_count: string;
  poor_count: string;
  class_names?: string;
  excellent_percentage: string;
  good_percentage: string;
  fair_percentage: string;
  average_percentage: string;
  poor_percentage: string;
}

interface ClassStats {
  class_name: string;
  faculty_name: string;
  total_students: number;
  average_score: number;
  excellent_good_rate: number;
  poor_count: number;
  excellent_percentage: string;
  good_percentage: string;
  fair_percentage: string;
  average_percentage: string;
  poor_percentage: string;
}

interface CohortStatsProps {
  selectedYear: string;
  selectedSemester: string;
  overview: {
    total_students: number;
    average_score: number;
    excellent_good_rate: number;
    poor_count: number;
  } | null;
  scoreDistribution: Array<{
    classification_group: string;
    count: number;
    percentage: number;
  }> | null;
}

interface CohortData {
  cohort: string;
  average_score: number;
  total_students: number;
  excellent_good_rate: number;
}

const CohortStats: React.FC<CohortStatsProps> = ({ 
  selectedYear,
  selectedSemester,
  overview,
  scoreDistribution
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CohortData[]>([]);
  const [localOverview, setLocalOverview] = useState(overview);
  const [localDistribution, setLocalDistribution] = useState(scoreDistribution);

  const columns: ColumnsType<any> = selectedYear === 'all' ? [
    {
      title: 'Khóa',
      dataIndex: 'cohort',
      key: 'cohort',
    },
    {
      title: 'Điểm TB',
      dataIndex: 'average_score',
      key: 'average_score',
      align: 'right',
      sorter: (a, b) => Number(a.average_score) - Number(b.average_score),
    },
    {
      title: 'SL Sinh viên',
      dataIndex: 'total_students',
      key: 'total_students',
      align: 'right',
      sorter: (a, b) => a.total_students - b.total_students,
    },
    {
      title: 'Tỷ lệ XS & Tốt',
      dataIndex: 'excellent_good_rate',
      key: 'excellent_good_rate',
      align: 'right',
      render: (value) => `${value}%`,
      sorter: (a, b) => Number(a.excellent_good_rate) - Number(b.excellent_good_rate),
    },
  ] : [
    {
      title: 'Lớp',
      dataIndex: 'class_name',
      key: 'class_name',
    },
    {
      title: 'Điểm TB',
      dataIndex: 'average_score',
      key: 'average_score',
      align: 'right',
      render: (value) => Number(value).toFixed(2),
      sorter: (a, b) => Number(a.average_score) - Number(b.average_score),
    },
    {
      title: 'SL Sinh viên',
      dataIndex: 'total_students',
      key: 'total_students',
      align: 'right',
      sorter: (a, b) => a.total_students - b.total_students,
    },
    {
      title: 'Xuất sắc',
      dataIndex: 'excellent_percentage',
      key: 'excellent_percentage',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)}%`,
      sorter: (a, b) => Number(a.excellent_percentage) - Number(b.excellent_percentage),
    },
    {
      title: 'Tốt',
      dataIndex: 'good_percentage',
      key: 'good_percentage',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)}%`,
      sorter: (a, b) => Number(a.good_percentage) - Number(b.good_percentage),
    }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        let endpoint = '';
        
        if (selectedYear === 'all') {
          if (selectedSemester === 'all') {
            endpoint = '/api/student-scores/stats/cohort/all';
          } else {
            const [semesterNo, academicYear] = selectedSemester.split('_').map(Number);
            endpoint = `/api/student-scores/stats/cohort/${semesterNo}/${academicYear}`;
          }
          
          const response = await api.get(endpoint);
          const batches = response.data.data.batches;
          
          if (Array.isArray(batches) && batches.length > 0) {
            setStats(batches.map(batch => ({
              cohort: batch.cohort ? `Khóa ${batch.cohort}` : 'Chưa có khóa',
              average_score: Number(Number(batch.average_score).toFixed(2)),
              total_students: batch.total_students,
              excellent_good_rate: Number((Number(batch.excellent_percentage) + Number(batch.good_percentage)).toFixed(2))
            })));
            
            // Cập nhật overview và score distribution từ tổng các khóa
            const totalStudents = batches.reduce((sum: number, b: CohortBatch) => sum + b.total_students, 0);
            const weightedScore = batches.reduce((sum: number, b: CohortBatch) => sum + Number(b.average_score) * b.total_students, 0);
            const avgScore = weightedScore / totalStudents;
            const excellentGoodRate = batches.reduce((sum: number, b: CohortBatch) => 
              sum + (Number(b.excellent_percentage) + Number(b.good_percentage)) * b.total_students / totalStudents, 0);
            
            setLocalOverview({
              total_students: totalStudents,
              average_score: Number(avgScore.toFixed(2)),
              excellent_good_rate: Number(excellentGoodRate.toFixed(2)),
              poor_count: batches.reduce((sum: number, b: CohortBatch) => sum + Number(b.poor_count), 0)
            });

            // Tính toán phân bố điểm từ tất cả các khóa
            const distribution = [
              {
                classification_group: 'Xuất sắc',
                count: batches.reduce((sum: number, b: CohortBatch) => 
                  sum + Math.round((Number(b.excellent_percentage || 0) * b.total_students) / 100), 0),
                percentage: 0
              },
              {
                classification_group: 'Tốt',
                count: batches.reduce((sum: number, b: CohortBatch) => 
                  sum + Math.round((Number(b.good_percentage || 0) * b.total_students) / 100), 0),
                percentage: 0
              },
              {
                classification_group: 'Khá',
                count: batches.reduce((sum: number, b: CohortBatch) => 
                  sum + Math.round((Number(b.fair_percentage || 0) * b.total_students) / 100), 0),
                percentage: 0
              },
              {
                classification_group: 'Trung bình',
                count: batches.reduce((sum: number, b: CohortBatch) => 
                  sum + Math.round((Number(b.average_percentage || 0) * b.total_students) / 100), 0),
                percentage: 0
              },
              {
                classification_group: 'Yếu',
                count: batches.reduce((sum: number, b: CohortBatch) => 
                  sum + Math.round((Number(b.poor_percentage || 0) * b.total_students) / 100), 0),
                percentage: 0
              }
            ];

            // Tính phần trăm cho từng nhóm
            const totalCount = distribution.reduce((sum, group) => sum + group.count, 0);
            distribution.forEach(group => {
              group.percentage = Number(((group.count * 100) / totalCount).toFixed(2));
            });

            setLocalDistribution(distribution);
          }
        } else {
          // Lấy thống kê chi tiết của các lớp trong khóa được chọn
          if (selectedSemester === 'all') {
            endpoint = `/api/student-scores/stats/cohort/${selectedYear}/classes`;
          } else {
            const [semesterNo, academicYear] = selectedSemester.split('_').map(Number);
            endpoint = `/api/student-scores/stats/cohort/${selectedYear}/classes/${semesterNo}/${academicYear}`;
          }
          
          const response = await api.get(endpoint);
          const classes = response.data.data.classes;
          
          if (Array.isArray(classes)) {
            setStats(classes);
            
            // Tính toán overview từ tất cả các lớp trong khóa
            const totalStudents = classes.reduce((sum: number, c: ClassStats) => sum + c.total_students, 0);
            const weightedScore = classes.reduce((sum: number, c: ClassStats) => sum + c.average_score * c.total_students, 0);
            const avgScore = weightedScore / totalStudents;
            const excellentGoodCount = classes.reduce((sum: number, c: ClassStats) => 
              sum + (c.total_students * (Number(c.excellent_percentage) + Number(c.good_percentage))) / 100, 0);
            
            setLocalOverview({
              total_students: totalStudents,
              average_score: Number(avgScore.toFixed(2)),
              excellent_good_rate: Number(((excellentGoodCount * 100) / totalStudents).toFixed(2)),
              poor_count: classes.reduce((sum: number, c: ClassStats) => sum + c.poor_count, 0)
            });

            const distribution = [
              {
                classification_group: 'Xuất sắc',
                count: classes.reduce((sum: number, c: ClassStats) => 
                  sum + Math.round((Number(c.excellent_percentage || 0) * c.total_students) / 100), 0),
                percentage: 0
              },
              {
                classification_group: 'Tốt',
                count: classes.reduce((sum: number, c: ClassStats) => 
                  sum + Math.round((Number(c.good_percentage || 0) * c.total_students) / 100), 0),
                percentage: 0
              },
              {
                classification_group: 'Khá',
                count: classes.reduce((sum: number, c: ClassStats) => 
                  sum + Math.round((Number(c.fair_percentage || 0) * c.total_students) / 100), 0),
                percentage: 0
              },
              {
                classification_group: 'Trung bình',
                count: classes.reduce((sum: number, c: ClassStats) => 
                  sum + Math.round((Number(c.average_percentage || 0) * c.total_students) / 100), 0),
                percentage: 0
              },
              {
                classification_group: 'Yếu',
                count: classes.reduce((sum: number, c: ClassStats) => 
                  sum + Math.round((Number(c.poor_percentage || 0) * c.total_students) / 100), 0),
                percentage: 0
              }
            ];

            // Tính phần trăm cho từng nhóm
            const totalCount = distribution.reduce((sum, group) => sum + group.count, 0);
            distribution.forEach(group => {
              group.percentage = Number(((group.count * 100) / totalCount).toFixed(2));
            });

            setLocalDistribution(distribution);
          }
        }
      } catch (error) {
        console.error('Error fetching cohort stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedYear, selectedSemester]);

  const getOverviewData = () => {
    if (!localOverview) return {
      totalStudents: 0,
      averageScore: 0,
      excellentGoodRate: 0,
      poorCount: 0
    };

    return {
      totalStudents: localOverview.total_students,
      averageScore: localOverview.average_score,
      excellentGoodRate: localOverview.excellent_good_rate,
      poorCount: localOverview.poor_count
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
        text: selectedYear === 'all' ? 'Phân bố xếp loại tất cả khóa' : `Phân bố xếp loại khóa ${selectedYear}`,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      }
    }
  };

  return (
    <div>
      <StatsOverview {...getOverviewData()} />

      <Row gutter={[16, 16]} className="mt-6">
        <Col span={12}>
          <Card>
            <Table 
              columns={columns} 
              dataSource={stats} 
              loading={loading}
              rowKey="cohort"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <div className="h-[400px]">
              {localDistribution && <PieChart data={localDistribution} options={pieOptions} />}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CohortStats; 