import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card } from 'antd';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ScoreRange {
  min_score: number;
  max_score: number;
  count: number;
}

interface ScoreDistributionProps {
  semesterNo?: number | null;
  academicYear?: number | null;
  selectedSemester: string;
}

export default function ScoreDistribution({ semesterNo, academicYear, selectedSemester }: ScoreDistributionProps) {
  const [scoreDistribution, setScoreDistribution] = useState<ScoreRange[]>([]);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        if (selectedSemester === 'all') {
          const response = await api.get('/api/student-scores/stats/distribution/all');
          setScoreDistribution(response.data.data.distribution);
        } else {
          const response = await api.get(`/api/student-scores/stats/distribution/${semesterNo}/${academicYear}`);
          setScoreDistribution(response.data.data.distribution);
        }
      } catch (error) {
        console.error('Error fetching score distribution:', error);
      }
    };

    fetchDistribution();
  }, [semesterNo, academicYear, selectedSemester]);

  const getBarChartData = (data: ScoreRange[]) => ({
    labels: data.map(range => `${range.min_score}-${range.max_score}`),
    datasets: [
      {
        label: 'Số lượng sinh viên',
        data: data.map(range => range.count),
        backgroundColor: data.map(range => {
          if (range.min_score >= 90) return '#4caf50';
          if (range.min_score >= 80) return '#2196f3';
          if (range.min_score >= 70) return '#ffc107';
          if (range.min_score >= 60) return '#ff9800';
          return '#f44336';
        }),
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { 
        display: true, 
        text: 'Phân bố điểm rèn luyện sinh viên',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Số lượng sinh viên'
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        title: {
          display: true,
          text: 'Khoảng điểm'
        }
      }
    }
  };

  const totalStudents = scoreDistribution.reduce((sum, range) => sum + range.count, 0);

  return (
    <div className="space-y-6">
      <Card title="Biểu đồ phân bố điểm">
        <Bar options={chartOptions} data={getBarChartData(scoreDistribution)} />
      </Card>

      <Card title="Chi tiết phân bố điểm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scoreDistribution.map((range, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg ${
                range.min_score >= 90 ? 'bg-green-50' :
                range.min_score >= 80 ? 'bg-blue-50' :
                range.min_score >= 70 ? 'bg-yellow-50' :
                range.min_score >= 60 ? 'bg-orange-50' :
                'bg-red-50'
              }`}
            >
              <div className="text-lg font-semibold">
                {range.min_score}-{range.max_score} điểm
              </div>
              <div className="text-2xl font-bold mt-2">
                {range.count} sinh viên
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {((range.count / totalStudents) * 100).toFixed(1)}% tổng số
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 