'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import Loading from '@/components/Loading';
import { Permission } from '@/types/permission';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Filter states
  const [actionFilters, setActionFilters] = useState({
    view: true,
    create: false,
    delete: false,
    update: false
  });

  const fetchRolePermissions = useCallback(async () => {
    try {
      const [roleRes, permissionsRes] = await Promise.all([
        api.get(`/api/roles/${roleId}`),
        api.get('/api/permissions')
      ]);

      if (roleRes.data.role) {
        setRoleName(roleRes.data.role.name);
        // Handle the actual API response structure
        setRolePermissions(roleRes.data.role.Permissions || []);
      }

      if (permissionsRes.data.permissions) {
        setAvailablePermissions(permissionsRes.data.permissions);
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Failed to fetch role permissions:', apiError);
      toast.error(apiError?.response?.data?.message || 'Không thể tải quyền hạn của vai trò');
      router.push('/uit/admin/roles');
    } finally {
      setLoading(false);
    }
  }, [roleId, router]);

  useEffect(() => {
    fetchRolePermissions();
  }, [roleId, fetchRolePermissions]);

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleActionFilterChange = (action: string) => {
    setActionFilters(prev => {
      // Reset tất cả về false, chỉ set action được chọn thành true
      const newFilters = {
        create: false,
        view: false,
        delete: false,
        update: false
      };
      
      // Nếu action hiện tại đã được chọn, thì bỏ chọn (cho phép không chọn gì)
      if (prev[action as keyof typeof prev]) {
        return newFilters; // Tất cả false
      } else {
        return {
          ...newFilters,
          [action]: true // Chỉ action này là true
        };
      }
    });
  };

  const handleSavePermissions = async () => {
    try {
      // Calculate final permissions: current permissions + toggle selected ones
      const currentPermissionIds = rolePermissions.map(p => p.id);
      let finalPermissions = [...currentPermissionIds];

      selectedPermissions.forEach(permissionId => {
        if (finalPermissions.includes(permissionId)) {
          // Remove if already exists (unassign)
          finalPermissions = finalPermissions.filter(id => id !== permissionId);
        } else {
          // Add if doesn't exist (assign)
          finalPermissions.push(permissionId);
        }
      });

      await api.post(`/api/role-permissions/${roleId}/permissions`, {
        permissionIds: finalPermissions
      });
      toast.success('Cập nhật quyền hạn thành công');
      await fetchRolePermissions();
      setSelectedPermissions([]);
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Failed to update role permissions:', apiError);
      toast.error(apiError?.response?.data?.message || 'Không thể cập nhật quyền hạn');
    }
  };

  // Filter permissions based on selected actions
  const filteredPermissions = availablePermissions.filter(permission => {
    const selectedActions = Object.entries(actionFilters)
      .filter(entry => entry[1])
      .map(entry => entry[0]);

    return selectedActions.length === 0 || selectedActions.includes(permission.action);
  });

  const selectedActionsCount = Object.values(actionFilters).filter(Boolean).length;

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý quyền hạn: {roleName}</h1>
        <button
          onClick={() => router.push('/uit/admin/roles')}
          className="px-4 py-2 bg-rose-400 text-white rounded hover:bg-rose-700"
        >
          Quay về danh sách
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          {/* Action Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Lọc theo loại quyền:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['view', 'create', 'update', 'delete'].map((action) => (
                <label key={action} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={actionFilters[action as keyof typeof actionFilters]}
                    onChange={() => handleActionFilterChange(action)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium capitalize">
                    {action === 'view' && 'View'}
                    {action === 'create' && 'Create'}
                    {action === 'delete' && 'Delete'}
                    {action === 'update' && 'Update'}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Đã chọn {selectedActionsCount} loại quyền • 
              Hiển thị {filteredPermissions.length}/{availablePermissions.length} quyền
            </p>
          </div>


          {/* Permissions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredPermissions.map((permission) => {
              const isAssigned = rolePermissions.some(
                rp => rp.id === permission.id
              );
              const isSelected = selectedPermissions.includes(permission.id);
              const willBeAssigned = isSelected ? !isAssigned : isAssigned;

              return (
                <div
                  key={permission.id}
                  onClick={() => handlePermissionToggle(permission.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected
                      ? willBeAssigned
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-red-100 border-red-300' 
                      : isAssigned
                        ? 'bg-green-50 border-green-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{permission.name}</h3>
                      <p className="text-sm text-gray-500">{permission.action}</p>
                      <p className="text-xs text-gray-400">ID: {permission.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAssigned && !isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {isSelected && (
                        <div className={`w-3 h-3 rounded-full ${willBeAssigned ? 'bg-blue-500' : 'bg-red-500'
                          }`} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons - Moved to bottom */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              onClick={handleSavePermissions}
              disabled={selectedPermissions.length === 0}
              className={`px-6 py-3 rounded text-white text-lg font-medium ${selectedPermissions.length > 0
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              Lưu thay đổi ({selectedPermissions.length})
            </button>
            <button
              onClick={() => setSelectedPermissions([])}
              disabled={selectedPermissions.length === 0}
              className="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-lg font-medium"
            >
              Hủy thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 