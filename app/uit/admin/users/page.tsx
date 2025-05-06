'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import api from '@/lib/api';
import { User } from '@/types/user';
import UserForm from '@/components/UserForm';
import UserTable from '@/components/UserTable';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import UserImport from '@/components/UserImport';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import Loading from '@components/Loading'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<'form' | 'import' | 'table'>('table');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

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
      const res = await api.post('/api/users', newUser);
      const createdUser = res.data.data.user;
      console.log('Created user:', createdUser[0])
      setUsers(prev => [...prev, createdUser[0]]);
      setActiveComponent('table');
      toast.success('Tạo người dùng thành công!');
      return { success: true };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi tạo người dùng.';
      toast.error(msg);
      return { success: false };
    }
  };

  const handleDeleteClick = (userId: number) => {
    setUserIdToDelete(userId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (userIdToDelete === null) return;
    try {
      await api.delete(`/api/users/${userIdToDelete}`);
      setUsers(prev => prev.filter(user => user.id !== userIdToDelete));
      toast.success('Xóa người dùng thành công!');
      toast.success('Xóa người dùng thành công!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi xóa người dùng';
      toast.error(msg);
    } finally {
      setShowConfirmModal(false);
      setUserIdToDelete(null);
    }
  };

  const handleUsersImported = async (importedUsers: User[]) => {
    try {
      await api.post('/api/users/import', importedUsers);
      fetchUsers();
      setActiveComponent('table');
      toast.success('Thêm người dùng thành công!');
      return { success: true };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi nhập người dùng.';
      toast.error(msg);
      return { success: false };
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (roleFilter === '' || user.role === roleFilter)
      ),
    [users, searchTerm, roleFilter]
  );

  const renderComponent = () => {
    switch (activeComponent) {
      case 'form':
        return <UserForm onUserCreated={handleCreateUser} setLoading={setLoading}/>;
      case 'import':
        return <UserImport onUsersImported={handleUsersImported} setLoadingManager={setLoading}/>;
      default:
        return <UserTable users={filteredUsers} onDeleteUser={handleDeleteClick} />;
    }
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {activeComponent === 'table' && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
          </select>

          <div className="flex gap-4">
            <button
              onClick={() => setActiveComponent('form')}
              className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm User
            </button>

            <button
              onClick={() => setActiveComponent('import')}
              className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import Users
            </button>
          </div>
        </div>
      )}

      {activeComponent !== 'table' && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setActiveComponent('table')}
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay về danh sách
          </button>
        </div>
      )}

      <div className="mb-6">{renderComponent()}</div>
    </div>
  );
}
