'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/layout/admin';


const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    activeCampaigns: 0,
    totalActivities: 0,
  });

  const [loading, setLoading] = useState(true);

  const classificationChartOptions = {
    chart: { type: 'pie' },
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

  const activityChartOptions = {
    chart: { type: 'bar' },
    xaxis: {
      categories: ['Campaign 1', 'Campaign 2', 'Campaign 3', 'Campaign 4', 'Campaign 5'],
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '55%' },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    title: { text: 'Student Activity Participation' },
    yaxis: { title: { text: 'Number of Students' } },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val: number) => `${val} students` }
    }
  };

  const activityChartSeries = [{
    name: 'Participation',
    data: [44, 55, 57, 56, 61]
  }];

  const scoresTrendOptions = {
    chart: { type: 'line', height: 350 },
    stroke: { curve: 'smooth', width: 2 },
    title: { text: 'Average Student Score Trends', align: 'left' },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    yaxis: {
      title: { text: 'Average Score' },
      min: 0,
      max: 100,
    }
  };

  const scoresTrendSeries = [{
    name: 'Average Score',
    data: [65, 68, 72, 75, 78, 75, 74, 77, 80, 82, 85, 87]
  }];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-pulse text-2xl text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Users', value: stats.totalUsers, color: 'blue' },
          { label: 'Total Students', value: stats.totalStudents, color: 'green' },
          { label: 'Active Campaigns', value: stats.activeCampaigns, color: 'yellow' },
          { label: 'Total Activities', value: stats.totalActivities, color: 'purple' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-medium mb-6">Student Classification Distribution</h2>
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
          <h2 className="text-xl font-medium mb-6">Activity Participation</h2>
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
        <h2 className="text-xl font-medium mb-6">Score Trends</h2>
        <Chart 
          options={scoresTrendOptions}
          series={scoresTrendSeries}
          type="line"
          height={350}
        />
      </motion.div>
    </AdminLayout>
  );
}