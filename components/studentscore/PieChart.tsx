import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: Array<{
    classification_group: string;
    count: number;
    percentage: number;
  }>;
  options?: ChartOptions<'pie'>;
}

const PieChart: React.FC<PieChartProps> = ({ data, options }) => {
  const chartData = {
    labels: data.map(item => item.classification_group),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          '#4CAF50', // Xuất sắc - Green
          '#2196F3', // Tốt - Blue
          '#FFC107', // Khá - Yellow
          '#FF9800', // Trung bình - Orange
          '#F44336', // Yếu - Red
        ],
      },
    ],
  };

  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      }
    }
  };

  return <Pie data={chartData} options={options || defaultOptions} />;
};

export default PieChart; 