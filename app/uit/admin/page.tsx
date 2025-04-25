'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    activeCampaigns: 0,
    totalActivities: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalUsers: 150,
        totalStudents: 120,
        activeCampaigns: 5,
        totalActivities: 25,
      });
      setLoading(false);
    }, 1000);

    // Example API call (commented out):
    // async function fetchData() {
    //   try {
    //     const response = await axios.get('/api/admin/stats');
    //     setStats(response.data);
    //   } catch (error) {
    //     console.error('Error fetching stats:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchData();
  }, []);

  const classificationChartOptions = {
    chart: {
      type: 'pie',
    },
    labels: ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const classificationChartSeries = [30, 40, 15, 10, 5]; // Dummy data

  // Chart options for activity participation
  const activityChartOptions = {
    chart: {
      type: 'bar',
    },
    xaxis: {
      categories: ['Campaign 1', 'Campaign 2', 'Campaign 3', 'Campaign 4', 'Campaign 5'],
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    title: {
      text: 'Student Activity Participation',
    },
    yaxis: {
      title: {
        text: 'Number of Students'
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " students"
        }
      }
    }
  };

  const activityChartSeries = [{
    name: 'Participation',
    data: [44, 55, 57, 56, 61]
  }];

  // Chart options for monthly scores trend
  const scoresTrendOptions = {
    chart: {
      type: 'line',
      height: 350
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    title: {
      text: 'Average Student Score Trends',
      align: 'left'
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    yaxis: {
      title: {
        text: 'Average Score'
      },
      min: 0,
      max: 100
    }
  };

  const scoresTrendSeries = [{
    name: 'Average Score',
    data: [65, 68, 72, 75, 78, 75, 74, 77, 80, 82, 85, 87]
  }];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-blue-800">Total Users</h2>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-green-800">Total Students</h2>
          <p className="text-3xl font-bold">{stats.totalStudents}</p>
        </div>
        <div className="bg-yellow-100 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-yellow-800">Active Campaigns</h2>
          <p className="text-3xl font-bold">{stats.activeCampaigns}</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-purple-800">Total Activities</h2>
          <p className="text-3xl font-bold">{stats.totalActivities}</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4">Student Classification Distribution</h2>
          {typeof window !== 'undefined' && (
            <Chart 
              options={classificationChartOptions}
              series={classificationChartSeries}
              type="pie"
              height={350}
            />
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4">Activity Participation</h2>
          {typeof window !== 'undefined' && (
            <Chart 
              options={activityChartOptions}
              series={activityChartSeries}
              type="bar"
              height={350}
            />
          )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-medium mb-4">Score Trends</h2>
        {typeof window !== 'undefined' && (
          <Chart 
            options={scoresTrendOptions}
            series={scoresTrendSeries}
            type="line"
            height={350}
          />
        )}
      </div>
    </div>
  );
} 