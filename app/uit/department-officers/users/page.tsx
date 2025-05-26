'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import { User } from '@/types/user';
import UserForm from '@/components/form/UserForm';
import UserTable from '@/components/Table/UserTable';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import UserImport from '@/components/Import/UserImport';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import Loading from '@components/Loading';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<'form' | 'import' | 'table'>('table');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await api.get('/api/users');
      setUsers(usersRes.data.data.users);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const rolesRes = await api.get('/api/roles');
      const allowedRoles = rolesRes.data.roles.filter(
        (role: { name: string }) => ['student', 'departmentofficer', 'classleader', 'advisor'].includes(role.name.toLowerCase())
      );
      setRoles(allowedRoles);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu vai trò');
    }
  }, []);

  useEffect(() => {
    // Use Promise.all to fetch data in parallel
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchRoles()]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [fetchUsers, fetchRoles]);

  const handleCreateUser = useCallback(async (newUser: { user_name: string; email: string; role_id: number }) => {
    try {
      await api.post('/api/users', newUser);
      await fetchUsers();
      setActiveComponent('table');
      return { success: true, message: 'Tạo người dùng thành công!' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Lỗi tạo người dùng.';
      return { success: false, message: msg };
    }
  }, [fetchUsers]);

  const handleDeleteClick = useCallback((userId: number) => {
    setUserIdToDelete(userId);
    setShowConfirmModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (userIdToDelete === null) return;
    try {
      await api.delete(`/api/users/${userIdToDelete}`);
      await fetchUsers();
      toast.success('Xóa người dùng thành công!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Lỗi xóa người dùng';
      toast.error(msg);
    } finally {
      setShowConfirmModal(false);
      setUserIdToDelete(null);
    }
  }, [userIdToDelete, fetchUsers]);

  const handleUsersImported = useCallback(async (importedUsers: unknown[]) => {
    try {
      await api.post('/api/users/import', importedUsers);
      await fetchUsers();
      setActiveComponent('table');
      toast.success('Thêm người dùng thành công!');
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Lỗi nhập người dùng.';
      toast.error(msg);
      return { success: false };
    }
  }, [fetchUsers]);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  // Add cleanup for debounce function
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const userName = String(user?.user_name || '').toLowerCase();
        const email = String(user?.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        const isAllowedRole = ['student', 'departmentofficer', 'classleader', 'advisor'].includes(user?.Role?.name?.toLowerCase() || '');

        return (
          isAllowedRole &&
          (userName.includes(search) || email.includes(search)) &&
          (roleFilter === '' || user?.Role?.name === roleFilter)
        );
      }),
    [users, searchTerm, roleFilter]
  );

  const setComponentView = useCallback((view: 'form' | 'import' | 'table') => {
    setActiveComponent(view);
  }, []);

  const renderComponent = useCallback(() => {
    switch (activeComponent) {
      case 'form':
        return <UserForm onUserCreated={handleCreateUser} setLoading={setLoading} roles={roles} />;
      case 'import':
        return <UserImport onUsersImported={handleUsersImported} setLoadingManager={setLoading} roles={roles} />;
      default:
        return <UserTable users={filteredUsers} onDeleteUser={handleDeleteClick} />;
    }
  }, [activeComponent, handleCreateUser, handleUsersImported, filteredUsers, handleDeleteClick, roles]);

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý người dùng</h1>

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
            {roles.map(role => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>

          <div className="flex gap-4">
            <button
              onClick={() => setComponentView('form')}
              className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm người dùng
            </button>

            <button
              onClick={() => setComponentView('import')}
              className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import người dùng
            </button>
          </div>
        </div>
      )}

      {activeComponent !== 'table' && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setComponentView('table')}
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