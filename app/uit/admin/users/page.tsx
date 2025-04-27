'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User } from "@/types/user";
import UserForm from '@/components/UserForm';
import UserTable from '@/components/UserTable';
import { ErrorModal } from '@/components/ErrorModal';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.data.users);
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (newUser: { name: string; email: string; password: string; role: string }) => {
    try {
      await api.post('/api/users', newUser);
      await fetchUsers();
      setShowForm(false);
      setError('');
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi tạo người dùng." );
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/api/users/${userId}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi xóa người dùng" );
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

      {error && <ErrorModal message={error} onClose={() => setError('')} />}

      {showForm ? (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-rose-400 text-white rounded hover:bg-rose-700"
            >
              Close Form
            </button>
          </div>

          <UserForm
            onUserCreated={(newUser) => {
              handleCreateUser(newUser);
            }}
          />
        </>
      ) : (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + New User
          </button>
        </div>
      )}
      <UserTable users={users} onDeleteUser={handleDeleteUser} />
    </div>
  );
}