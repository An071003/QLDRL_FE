import { Card } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DistributionItem {
  excellent_count: number;
  good_count: number;
  fair_count: number;
  average_count: number;
  poor_count: number;
  [key: string]: any; // For label field (class_name, faculty_name, etc.)
}

interface DistributionChartProps {
  data: DistributionItem[];
  labelField: string;
  title: string;
  height?: number;
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  labelField,
  title,
  height = 400
}) => {
  const chartData = {
    labels: data.map(item => item[labelField]),
    datasets: [
      {
        label: 'Xuất sắc',
        data: data.map(item => Number(item.excellent_count) || 0),
        backgroundColor: '#4CAF50',
      },
      {
        label: 'Tốt',
        data: data.map(item => Number(item.good_count) || 0),
        backgroundColor: '#2196F3',
      },
      {
        label: 'Khá',
        data: data.map(item => Number(item.fair_count) || 0),
        backgroundColor: '#FFC107',
      },
      {
        label: 'Trung bình',
        data: data.map(item => Number(item.average_count) || 0),
        backgroundColor: '#FF9800',
      },
      {
        label: 'Yếu',
        data: data.map(item => Number(item.poor_count) || 0),
        backgroundColor: '#F44336',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
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
    <Card title={title} className={`h-[${height}px]`}>
      <div style={{ height: `${height - 100}px` }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default DistributionChart; 