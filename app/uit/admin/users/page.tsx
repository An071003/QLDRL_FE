'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'lecturer';
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulate fetching users from API
    setTimeout(() => {
      const dummyUsers = [
        { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin', created_at: '2023-01-01' },
        { id: 2, name: 'Student 1', email: 'student1@example.com', role: 'student', created_at: '2023-01-02' },
        { id: 3, name: 'Lecturer 1', email: 'lecturer1@example.com', role: 'lecturer', created_at: '2023-01-03' },
        { id: 4, name: 'Student 2', email: 'student2@example.com', role: 'student', created_at: '2023-01-04' },
      ] as User[];
      
      setUsers(dummyUsers);
      setLoading(false);
    }, 1000);
    
    // In a real application, use:
    // async function fetchUsers() {
    //   try {
    //     const response = await axios.get('/api/admin/users');
    //     setUsers(response.data);
    //   } catch (error) {
    //     console.error('Error fetching users:', error);
    //     setError('Failed to load users');
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      // In a real application, use:
      // const response = await axios.post('/api/admin/users', newUser);
      // setUsers([...users, response.data]);
      
      // Simulating API call
      const createdUser = {
        ...newUser,
        id: users.length + 1,
        created_at: new Date().toISOString().split('T')[0]
      } as User;
      
      setUsers([...users, createdUser]);
      setNewUser({ name: '', email: '', password: '', role: 'student' });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      // In a real application, use:
      // await axios.delete(`/api/admin/users/${userId}`);
      
      // Simulating API call
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create User Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-medium mb-4">Create New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isCreating ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'lecturer' ? 'bg-green-100 text-green-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{user.created_at}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
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