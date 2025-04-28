'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamically import ApexCharts components to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Criterion {
  id: number;
  name: string;
  max_score: number;
}

export default function CriteriaManagement() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCriterion, setNewCriterion] = useState({ name: '', max_score: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulate fetching criteria from API
    setTimeout(() => {
      const dummyCriteria = [
        { id: 1, name: 'Học tập', max_score: 30 },
        { id: 2, name: 'Đạo đức', max_score: 25 },
        { id: 3, name: 'Hoạt động xã hội', max_score: 20 },
        { id: 4, name: 'Thể dục thể thao', max_score: 15 },
        { id: 5, name: 'Kỹ năng mềm', max_score: 10 },
      ] as Criterion[];
      
      setCriteria(dummyCriteria);
      setLoading(false);
    }, 1000);
    
    // In a real application, use:
    // async function fetchCriteria() {
    //   try {
    //     const response = await axios.get('/api/admin/criteria');
    //     setCriteria(response.data);
    //   } catch (error) {
    //     console.error('Error fetching criteria:', error);
    //     setError('Failed to load criteria');
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchCriteria();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCriterion({ 
      ...newCriterion, 
      [name]: name === 'max_score' ? parseInt(value) || 0 : value 
    });
  };

  const handleCreateCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      // In a real application, use:
      // const response = await axios.post('/api/admin/criteria', newCriterion);
      // setCriteria([...criteria, response.data]);
      
      // Simulating API call
      const createdCriterion = {
        ...newCriterion,
        id: criteria.length + 1
      } as Criterion;
      
      setCriteria([...criteria, createdCriterion]);
      setNewCriterion({ name: '', max_score: 0 });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating criterion:', error);
      setError('Failed to create criterion');
      setIsCreating(false);
    }
  };

  const handleDeleteCriterion = async (criterionId: number) => {
    if (!confirm('Are you sure you want to delete this criterion?')) {
      return;
    }

    try {
      // In a real application, use:
      // await axios.delete(`/api/admin/criteria/${criterionId}`);
      
      // Simulating API call
      setCriteria(criteria.filter(criterion => criterion.id !== criterionId));
    } catch (error) {
      console.error('Error deleting criterion:', error);
      setError('Failed to delete criterion');
    }
  };

  // Chart options for criteria distribution
  const criteriaChartOptions = {
    chart: {
      type: 'pie',
    },
    labels: criteria.map(c => c.name),
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    title: {
      text: 'Max Score Distribution',
      align: 'center',
    }
  };

  const criteriaChartSeries = criteria.map(c => c.max_score);

  // Bar chart for criteria comparison
  const criteriaBarOptions = {
    chart: {
      type: 'bar',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      offsetX: -6,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: criteria.map(c => c.name),
      title: {
        text: 'Max Score'
      }
    },
    title: {
      text: 'Criteria Max Score Comparison',
      align: 'center',
    },
    colors: ['#2563EB']
  };

  const criteriaBarSeries = [{
    name: 'Max Score',
    data: criteria.map(c => c.max_score)
  }];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl">Loading criteria...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Criteria Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Criterion Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-medium mb-4">Add New Criterion</h2>
        <form onSubmit={handleCreateCriterion} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={newCriterion.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <input
                type="number"
                name="max_score"
                value={newCriterion.max_score}
                onChange={handleInputChange}
                min="0"
                max="100"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isCreating ? 'Adding...' : 'Add Criterion'}
          </button>
        </form>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4">Criteria Max Score Distribution</h2>
          {typeof window !== 'undefined' && criteria.length > 0 && (
            <Chart 
              options={criteriaChartOptions}
              series={criteriaChartSeries}
              type="pie"
              height={350}
            />
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4">Criteria Comparison</h2>
          {typeof window !== 'undefined' && criteria.length > 0 && (
            <Chart 
              options={criteriaBarOptions}
              series={criteriaBarSeries}
              type="bar"
              height={350}
            />
          )}
        </div>
      </div>
      
      {/* Criteria Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Score</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {criteria.map((criterion) => (
              <tr key={criterion.id}>
                <td className="px-6 py-4 whitespace-nowrap">{criterion.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{criterion.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{criterion.max_score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleDeleteCriterion(criterion.id)}
                    className="text-red-600 hover:text-red-900 ml-2"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}