'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User } from "@/types/user";
import UserForm from '@/components/UserForm';
import UserTable from '@/components/UserTable';
import { ErrorModal } from '@/components/ErrorModal';
import UserImport from '@/components/UserImport';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<'form' | 'import' | 'table'>('table');
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

  const handleCreateUser = async (newUser: { name: string; email: string; role: string }) => {
    try {
      await api.post('/api/users', newUser);
      await fetchUsers();
      setActiveComponent('table');
      setError('');
      return { success: true };
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi tạo người dùng.");
      return { success: false };
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/api/users/${userId}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi xóa người dùng");
    }
  };

  const handleUsersImported = async (importedUsers: User[]) => {
    try {
      console.log('Imported users:', importedUsers);
      await api.post('/api/users/import', importedUsers);
      await fetchUsers();
      setActiveComponent('table');
      return { success: true };
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi nhập người dùng.");
      return { success: false };
    }
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'form':
        return <UserForm onUserCreated={handleCreateUser} />;
      case 'import':
        return <UserImport onUsersImported={handleUsersImported} />;
      default:
        return <UserTable users={users} onDeleteUser={handleDeleteUser} />;
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

      <div className="flex justify-end gap-4 mb-6">
        {activeComponent === 'table' ? (
          <>
            <button
              onClick={() => setActiveComponent('form')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + New User
            </button>

            <button
              onClick={() => setActiveComponent('import')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import Users
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveComponent('table')}
            className="px-4 py-2 bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Back to Users List
          </button>
        )}
      </div>

      <div className="mb-6">
        {renderComponent()}
      </div>
    </div>
  );
}
