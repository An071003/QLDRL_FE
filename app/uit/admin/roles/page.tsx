'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import Loading from '@components/Loading';
import RoleTable from '@/components/Table/RoleTable';
import RoleForm from '@/components/form/RoleForm';
import PermissionForm from '@/components/form/PermissionForm';
import PermissionTable from '@/components/Table/PermissionTable';
import { Role } from '@/types/role';
import { Permission } from '@/types/permission';
import { useRouter } from 'next/navigation';

export default function RoleManagement() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<'roleTable' | 'roleForm' | 'permissionTable' | 'permissionForm'>('roleTable');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'role' | 'permission' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/roles');
      setRoles(response.data.roles);
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu vai trò');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/permissions');
      setPermissions(response.data.permissions);
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu quyền hạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const handleCreateRole = async (newRole: { name: string }) => {
    try {
      const res = await api.post('/api/roles', newRole);
      const createdRole = res.data.role;
      setRoles(prev => [...prev, createdRole]);
      setActiveComponent('roleTable');
      return { success: true, message: 'Tạo vai trò thành công!' };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi tạo vai trò.';
      return { success: false, message: msg };
    }
  };

  const handleUpdateRole = async (roleId: number, updatedData: { name: string }) => {
    try {
      await api.put(`/api/roles/${roleId}`, updatedData);
      setRoles(prev => prev.map(role => 
        role.id === roleId ? { ...role, name: updatedData.name } : role
      ));
      
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi cập nhật vai trò.';
      toast.error(msg);
      return false;
    }
  };

  const handleCreatePermission = async (newPermission: { name: string; action: string }) => {
    try {
      const res = await api.post('/api/permissions', newPermission);
      const createdPermission = res.data.permission;
      setPermissions(prev => [...prev, createdPermission]);
      setActiveComponent('permissionTable');
      return { success: true, message: 'Tạo quyền hạn thành công!' };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi tạo quyền hạn.';
      return { success: false, message: msg };
    }
  };

  const handleManageRolePermissions = (roleId: number) => {
    router.push(`/uit/admin/roles/${roleId}/permissions`);
  };

  const handleDeleteClick = (id: number, type: 'role' | 'permission') => {
    setItemToDelete({ id, type });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'role') {
        await api.delete(`/api/roles/${itemToDelete.id}`);
        setRoles(prev => prev.filter(role => role.id !== itemToDelete.id));
        toast.success('Xóa vai trò thành công!');
      } else {
        await api.delete(`/api/permissions/${itemToDelete.id}`);
        setPermissions(prev => prev.filter(permission => permission.id !== itemToDelete.id));
        toast.success('Xóa quyền hạn thành công!');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Lỗi xóa ${itemToDelete.type === 'role' ? 'vai trò' : 'quyền hạn'}`;
      toast.error(msg);
    } finally {
      setShowConfirmModal(false);
      setItemToDelete(null);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) => {
        const roleName = String(role?.name || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return roleName.includes(search);
      }),
    [roles, searchTerm]
  );

  const filteredPermissions = useMemo(
    () =>
      permissions.filter((permission) => {
        const permissionName = String(permission?.name || '').toLowerCase();
        const permissionAction = String(permission?.action || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return permissionName.includes(search) || permissionAction.includes(search);
      }),
    [permissions, searchTerm]
  );

  const renderComponent = () => {
    switch (activeComponent) {
      case 'roleForm':
        return <RoleForm onRoleCreated={handleCreateRole} setLoading={setLoading} />;
      case 'permissionForm':
        return <PermissionForm onPermissionCreated={handleCreatePermission} setLoading={setLoading} />;
      case 'permissionTable':
        return <PermissionTable permissions={filteredPermissions} onDeletePermission={(id: number) => handleDeleteClick(id, 'permission')} />;
      default:
        return <RoleTable 
          roles={filteredRoles} 
          onDeleteRole={(id: number) => handleDeleteClick(id, 'role')} 
          onManagePermissions={(roleId: number) => handleManageRolePermissions(roleId)}
          onUpdateRole={handleUpdateRole}
        />;
    }
  };

  if (loading && roles.length === 0 && permissions.length === 0) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Role and Permission Management</h1>

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
      />

      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
          />

          <div className="flex gap-2">
            {/* Switch between role and permission management */}
            {['roleTable', 'roleForm'].includes(activeComponent) && (
              <button
                onClick={() => setActiveComponent('permissionTable')}
                className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Quản lý Quyền hạn
              </button>
            )}

            {['permissionTable', 'permissionForm'].includes(activeComponent) && (
              <button
                onClick={() => setActiveComponent('roleTable')}
                className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Quản lý Vai trò
              </button>
            )}
            
            {activeComponent === 'roleTable' && (
              <button
                onClick={() => setActiveComponent('roleForm')}
                className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Thêm Vai trò
              </button>
            )}

            {activeComponent === 'permissionTable' && (
              <button
                onClick={() => setActiveComponent('permissionForm')}
                className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Thêm Quyền hạn
              </button>
            )}

            {activeComponent === 'roleForm' && (
              <button
                onClick={() => setActiveComponent('roleTable')}
                className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
              >
                Quay về danh sách
              </button>
            )}

            {activeComponent === 'permissionForm' && (
              <button
                onClick={() => setActiveComponent('permissionTable')}
                className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
              >
                Quay về danh sách
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">{renderComponent()}</div>
    </div>
  );
} 