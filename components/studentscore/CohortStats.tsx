'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import StatsOverview from './StatsOverview';
import PieChart from './PieChart';

interface CohortStatsProps {
  selectedYear: string;
  statsEndpoint: string;
  overview: {
    total_students: number;
    average_score: number;
    excellent_percentage: number;
    good_percentage: number;
    poor_percentage: number;
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
  statsEndpoint,
  overview,
  scoreDistribution
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CohortData[]>([]);
  const [localOverview, setLocalOverview] = useState(overview);
  const [localDistribution, setLocalDistribution] = useState(scoreDistribution);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get(statsEndpoint);
        let formattedStats;

        if (selectedYear === 'all') {
          // Format data for all cohorts
          const batches = response.data.data.batches;
          if (Array.isArray(batches)) {
            formattedStats = batches.map((batch: any) => ({
              cohort: batch.cohort ? `Khóa ${batch.cohort}` : 'Chưa có khóa',
              average_score: Number(batch.average_score).toFixed(2),
              total_students: batch.total_students,
              excellent_good_rate: (
                (Number(batch.excellent_count) + Number(batch.good_count)) * 100 / batch.total_students
              ).toFixed(2)
            }));
          } else if (batches) {
            // Nếu batches là một object đơn lẻ
            formattedStats = [{
              cohort: 'Tổng',
              average_score: Number(batches.average_score).toFixed(2),
              total_students: batches.total_students,
              excellent_good_rate: (
                (Number(batches.excellent_count) + Number(batches.good_count)) * 100 / batches.total_students
              ).toFixed(2)
            }];
          }
        } else {
          // Format data for classes in a specific cohort
          const classes = response.data.data.classes;
          formattedStats = classes.map((classData: any) => ({
            cohort: classData.class_name,
            average_score: Number(classData.average_score).toFixed(2),
            total_students: classData.total_students,
            excellent_good_rate: (
              (Number(classData.excellent_count) + Number(classData.good_count)) * 100 / classData.total_students
            ).toFixed(2)
          }));

          // Cập nhật overview và scoreDistribution từ response
          if (response.data.data.overview) {
            setLocalOverview(response.data.data.overview);
          }
          if (response.data.data.scoreDistribution) {
            setLocalDistribution(response.data.data.scoreDistribution);
          }
        }

        setStats(formattedStats);
      } catch (error) {
        console.error('Error fetching cohort stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [statsEndpoint, selectedYear]);

  // Chỉ cập nhật overview và scoreDistribution khi chọn "Tất cả khóa"
  useEffect(() => {
    if (selectedYear === 'all') {
      setLocalOverview(overview);
      setLocalDistribution(scoreDistribution);
    }
  }, [overview, scoreDistribution, selectedYear]);

  const columns: ColumnsType<CohortData> = [
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
  ];

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
      excellentGoodRate: localOverview.excellent_percentage + localOverview.good_percentage,
      poorCount: localOverview.poor_percentage
    };
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: selectedYear === 'all' ? 'Phân bố xếp loại tất cả khóa' : `Phân bố xếp loại khóa ${selectedYear}`,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value} sinh viên (${localDistribution?.[context.dataIndex]?.percentage || 0}%)`;
          },
        },
      },
    }
  };

  return (
    <div>
      <StatsOverview {...getOverviewData()} />

      <Row gutter={[16, 16]} className="mt-6">
        <Col span={12}>
          <Table 
            columns={columns} 
            dataSource={stats} 
            loading={loading}
            rowKey="cohort"
            pagination={false}
          />
        </Col>
        <Col span={12}>
          <Card className="h-[500px]">
            <div style={{ height: '400px' }}>
              {localDistribution && <PieChart data={localDistribution} options={pieOptions} />}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CohortStats; 