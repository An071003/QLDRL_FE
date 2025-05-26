'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import Loading from '@/components/Loading';
import { Permission } from '@/types/permission';

interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  Permission: Permission;
}

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
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const fetchRolePermissions = useCallback(async () => {
    try {
      const [roleRes, permissionsRes] = await Promise.all([
        api.get(`/api/roles/${roleId}`),
        api.get('/api/permissions')
      ]);

      if (roleRes.data.role) {
        setRoleName(roleRes.data.role.name);
        setRolePermissions(roleRes.data.role.RolePermissions || []);
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

  const handleSavePermissions = async () => {
    try {
      await api.post(`/api/roles/${roleId}/permissions`, {
        permissionIds: selectedPermissions
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

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý quyền hạn: {roleName}</h1>
        <div className="flex gap-4">
          <button
            onClick={handleSavePermissions}
            disabled={selectedPermissions.length === 0}
            className={`px-4 py-2 rounded text-white ${
              selectedPermissions.length > 0
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Lưu thay đổi
          </button>
          <button
            onClick={() => router.push('/uit/admin/roles')}
            className="px-4 py-2 bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay về danh sách
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePermissions.map((permission) => {
              const isAssigned = rolePermissions.some(
                rp => rp.permission_id === permission.id
              );
              const isSelected = selectedPermissions.includes(permission.id);

              return (
                <div
                  key={permission.id}
                  onClick={() => handlePermissionToggle(permission.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isAssigned
                      ? 'bg-green-50 border-green-200'
                      : isSelected
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{permission.name}</h3>
                      <p className="text-sm text-gray-500">{permission.action}</p>
                    </div>
                    {isAssigned && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 