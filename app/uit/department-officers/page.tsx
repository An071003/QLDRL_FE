'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Separate component for all charts
const DashboardCharts = () => {
  const classificationChartOptions: ApexOptions = {
    chart: { type: 'pie' as const },
    labels: ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' }
      }
    }]
  };

  const classificationChartSeries = [30, 40, 15, 10, 5];

  const activityChartOptions: ApexOptions = {
    chart: { type: 'bar' as const },
    xaxis: {
      categories: ['Campaign 1', 'Campaign 2', 'Campaign 3', 'Campaign 4', 'Campaign 5'],
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '55%' },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    title: { text: 'Tham gia hoạt động của sinh viên' },
    yaxis: { title: { text: 'Số sinh viên' } },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val: number) => `${val} sinh viên` }
    }
  };

  const activityChartSeries = [{
    name: 'Tham gia',
    data: [44, 55, 57, 56, 61]
  }];

  const scoresTrendOptions: ApexOptions = {
    chart: { type: 'line' as const, height: 350 },
    stroke: { curve: 'smooth', width: 2 },
    title: { text: 'Điểm trung bình của sinh viên', align: 'left' },
    xaxis: {
      categories: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    },
    yaxis: {
      title: { text: 'Điểm trung bình' },
      min: 0,
      max: 100,
    }
  };

  const scoresTrendSeries = [{
    name: 'Điểm trung bình',
    data: [65, 68, 72, 75, 78, 75, 74, 77, 80, 82, 85, 87]
  }];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-medium mb-6">Phân loại sinh viên</h2>
          <Chart 
            options={classificationChartOptions}
            series={classificationChartSeries}
            type="pie"
            height={350}
          />
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-medium mb-6">Tham gia hoạt động</h2>
          <Chart 
            options={activityChartOptions}
            series={activityChartSeries}
            type="bar"
            height={350}
          />
        </motion.div>
      </div>

      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-white p-6 rounded-2xl shadow-lg mb-8"
      >
        <h2 className="text-xl font-medium mb-6">Xu hướng điểm số</h2>
        <Chart 
          options={scoresTrendOptions}
          series={scoresTrendSeries}
          type="line"
          height={350}
        />
      </motion.div>
    </>
  );
};

export default function DPODashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCampaigns: 0,
    totalActivities: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalStudents: 1250,
        activeCampaigns: 8,
        totalActivities: 24
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-pulse text-2xl text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Bảng điều khiển</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Tổng sinh viên', value: stats.totalStudents, color: 'green' },
          { label: 'Phong trào đang hoạt động', value: stats.activeCampaigns, color: 'yellow' },
          { label: 'Tổng hoạt động', value: stats.totalActivities, color: 'purple' },
        ].map((item, index) => (
          <motion.div 
            key={index} 
            whileHover={{ scale: 1.05 }}
            className={`bg-${item.color}-100 p-6 rounded-2xl shadow-lg`}
          >
            <h2 className={`text-lg font-medium text-${item.color}-800`}>{item.label}</h2>
            <p className="text-3xl font-bold">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showCharts ? 'Ẩn biểu đồ' : 'Hiển thị biểu đồ'}
        </button>
      </div>

      {showCharts && <DashboardCharts />}
    </div>
  );
} 