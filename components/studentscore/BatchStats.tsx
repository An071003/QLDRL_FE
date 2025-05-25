import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Select, Card } from 'antd';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const { Option } = Select;

interface StatData {
  academic_year: number;
  average_score: number;
  student_count: number;
  excellent_count: number;
  good_count: number;
  fair_count: number;
  average_count: number;
  poor_count: number;
}

interface BatchStatsProps {
  academicYear?: number | null;
  selectedSemester: string;
}

export default function BatchStats({ academicYear, selectedSemester }: BatchStatsProps) {
  const [batchStats, setBatchStats] = useState<StatData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Assuming we have an API endpoint for batch statistics
        const response = await api.get(`/api/student-scores/stats/batch/${academicYear}`);
        setBatchStats(response.data.data.stats);
        setSelectedYear(academicYear);
      } catch (error) {
        console.error('Error fetching batch stats:', error);
      }
    };

    fetchStats();
  }, [academicYear]);

  const getBarChartData = (data: StatData[]) => ({
    labels: ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'],
    datasets: [{
      label: `Khóa ${selectedYear}`,
      data: [
        data[0]?.excellent_count || 0,
        data[0]?.good_count || 0,
        data[0]?.fair_count || 0,
        data[0]?.average_count || 0,
        data[0]?.poor_count || 0,
      ],
      backgroundColor: [
        '#4caf50',
        '#2196f3',
        '#ffc107',
        '#ff9800',
        '#f44336',
      ],
    }],
  });

  const getLineChartData = (data: StatData[]) => ({
    labels: data.map(d => `Học kỳ ${d.academic_year}`),
    datasets: [
      {
        label: 'Xuất sắc',
        data: data.map(d => d.excellent_count),
        borderColor: '#4caf50',
        tension: 0.1,
      },
      {
        label: 'Tốt',
        data: data.map(d => d.good_count),
        borderColor: '#2196f3',
        tension: 0.1,
      },
      {
        label: 'Khá',
        data: data.map(d => d.fair_count),
        borderColor: '#ffc107',
        tension: 0.1,
      },
      {
        label: 'Trung bình',
        data: data.map(d => d.average_count),
        borderColor: '#ff9800',
        tension: 0.1,
      },
      {
        label: 'Yếu',
        data: data.map(d => d.poor_count),
        borderColor: '#f44336',
        tension: 0.1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Thống kê điểm rèn luyện khóa ${selectedYear}` },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const selectedBatch = batchStats.find(stat => stat.academic_year === selectedYear);

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <Select
          placeholder="Chọn khóa"
          style={{ width: 200 }}
          value={selectedYear}
          onChange={setSelectedYear}
        >
          {batchStats.map(stat => (
            <Option key={stat.academic_year} value={stat.academic_year}>
              {`Khóa ${stat.academic_year}`}
            </Option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Phân bố xếp loại">
          <Bar options={chartOptions} data={getBarChartData(batchStats.filter(s => s.academic_year === selectedYear))} />
        </Card>

        <Card title="Xu hướng theo học kỳ">
          <Line options={chartOptions} data={getLineChartData(batchStats)} />
        </Card>
      </div>

      {selectedBatch && (
        <Card title="Thống kê chi tiết">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-lg font-bold">Tổng số</div>
              <div className="text-2xl text-blue-600">
                {selectedBatch.student_count}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-lg font-bold">Xuất sắc</div>
              <div className="text-2xl text-green-600">
                {selectedBatch.excellent_count}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-lg font-bold">Tốt</div>
              <div className="text-2xl text-blue-600">
                {selectedBatch.good_count}
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-lg font-bold">Khá</div>
              <div className="text-2xl text-yellow-600">
                {selectedBatch.fair_count}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <div className="text-lg font-bold">Trung bình</div>
              <div className="text-2xl text-orange-600">
                {selectedBatch.average_count}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-lg font-bold">Yếu</div>
              <div className="text-2xl text-red-600">
                {selectedBatch.poor_count}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 