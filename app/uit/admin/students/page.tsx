'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Student {
  id: string;
  student_name: string;
  status: 'none' | 'disciplined';
  sumscore: number;
  user_id: number;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({ id: '', student_name: '', user_id: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulate fetching students from API
    setTimeout(() => {
      const dummyStudents = [
        { id: '21520001', student_name: 'Nguyen Van A', status: 'none', sumscore: 85, user_id: 2 },
        { id: '21520002', student_name: 'Tran Thi B', status: 'none', sumscore: 92, user_id: 4 },
        { id: '21520003', student_name: 'Le Van C', status: 'disciplined', sumscore: 67, user_id: 5 },
        { id: '21520004', student_name: 'Pham Thi D', status: 'none', sumscore: 78, user_id: 6 },
      ] as Student[];
      
      setStudents(dummyStudents);
      setLoading(false);
    }, 1000);
    
    // In a real application, use:
    // async function fetchStudents() {
    //   try {
    //     const response = await axios.get('/api/admin/students');
    //     setStudents(response.data);
    //   } catch (error) {
    //     console.error('Error fetching students:', error);
    //     setError('Failed to load students');
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchStudents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStudent({ ...newStudent, [name]: value });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      // In a real application, use:
      // const response = await axios.post('/api/admin/students', newStudent);
      // setStudents([...students, response.data]);
      
      // Simulating API call
      const createdStudent = {
        ...newStudent,
        status: 'none',
        sumscore: 0,
        user_id: parseInt(newStudent.user_id)
      } as Student;
      
      setStudents([...students, createdStudent]);
      setNewStudent({ id: '', student_name: '', user_id: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating student:', error);
      setError('Failed to create student');
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (studentId: string) => {
    try {
      // In a real application, use:
      // await axios.patch(`/api/admin/students/${studentId}/toggle-status`);
      
      // Simulating API call
      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: student.status === 'none' ? 'disciplined' : 'none' } 
          : student
      ));
    } catch (error) {
      console.error('Error toggling student status:', error);
      setError('Failed to update student status');
    }
  };

  const scoreDistributionOptions = {
    chart: {
      type: 'bar',
    },
    xaxis: {
      categories: ['0-50', '51-65', '66-80', '81-90', '91-100'],
      title: {
        text: 'Score Ranges'
      }
    },
    yaxis: {
      title: {
        text: 'Number of Students'
      }
    },
    title: {
      text: 'Student Score Distribution',
      align: 'center'
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
    colors: ['#4F46E5']
  };


  const calculateScoreDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    
    students.forEach(student => {
      const score = student.sumscore || 0;
      if (score <= 50) distribution[0]++;
      else if (score <= 65) distribution[1]++;
      else if (score <= 80) distribution[2]++;
      else if (score <= 90) distribution[3]++;
      else distribution[4]++;
    });
    
    return distribution;
  };

  const scoreDistributionSeries = [
    {
      name: 'Students',
      data: calculateScoreDistribution()
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl">Loading students...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Student Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Student Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-medium mb-4">Add New Student</h2>
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input
                type="text"
                name="id"
                value={newStudent.id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
              <input
                type="text"
                name="student_name"
                value={newStudent.student_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="number"
                name="user_id"
                value={newStudent.user_id}
                onChange={handleInputChange}
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
            {isCreating ? 'Adding...' : 'Add Student'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-medium mb-4">Score Distribution</h2>
        {typeof window !== 'undefined' && (
          <Chart 
            options={scoreDistributionOptions}
            series={scoreDistributionSeries}
            type="bar"
            height={350}
          />
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">{student.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{student.student_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{student.sumscore}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${student.status === 'disciplined' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {student.status === 'disciplined' ? 'Disciplined' : 'Normal'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleToggleStatus(student.id)}
                    className={`${
                      student.status === 'disciplined' 
                        ? 'text-green-600 hover:text-green-900' 
                        : 'text-red-600 hover:text-red-900'
                    } ml-2`}
                  >
                    {student.status === 'disciplined' ? 'Remove Discipline' : 'Mark Disciplined'}
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