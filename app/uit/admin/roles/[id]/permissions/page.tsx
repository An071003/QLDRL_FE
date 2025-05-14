'use client';

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from '@/lib/api';
import { PlusCircle, CheckCircle, XCircle, ArrowLeft, Search, Filter } from "lucide-react";
import Loading from '@components/Loading';
import { Permission } from '@/types/permission';
import debounce from 'lodash.debounce';

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = Number(params.id);
  
  const [loading, setLoading] = useState(true);
  const [roleName, setRoleName] = useState("");
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    const fetchRoleInfo = async () => {
      try {
        const roleResponse = await api.get(`/api/roles/${roleId}`);
        setRoleName(roleResponse.data.role?.name || "Vai trò không xác định");
      } catch (error) {
        toast.error('Lỗi khi tải thông tin vai trò');
        router.push('/uit/admin/roles');
      }
    };
    
    fetchRoleInfo();
  }, [roleId, router]);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const [permissionsResponse, rolePermissionsResponse] = await Promise.all([
          api.get('/api/permissions'),
          api.get(`/api/role-permissions/${roleId}/permissions`)
        ]);
        
        setAllPermissions(permissionsResponse.data.permissions || []);
        setSelectedPermissions(
          (rolePermissionsResponse.data.permissions || []).map((p: Permission) => p.id)
        );
      } catch (error) {
        toast.error('Lỗi khi tải dữ liệu quyền hạn');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, [roleId]);

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const savePermissions = async () => {
    setLoading(true);
    try {
      await api.post(`/api/role-permissions/${roleId}/permissions`, {
        permissionIds: selectedPermissions
      });
      toast.success('Đã cập nhật quyền cho vai trò');
      router.push('/uit/admin/roles');
    } catch (error) {
      toast.error('Lỗi khi cập nhật quyền');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/uit/admin/roles');
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleActionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(e.target.value);
  };

  const filteredPermissions = useMemo(() => {
    return allPermissions.filter(permission => {
      const nameMatch = permission.name.toLowerCase().includes(searchTerm.toLowerCase());
      const actionMatch = actionFilter === 'all' || permission.action.toLowerCase() === actionFilter.toLowerCase();
      return nameMatch && actionMatch;
    });
  }, [allPermissions, searchTerm, actionFilter]);

  const availableActions = useMemo(() => {
    const actions = allPermissions.map(p => p.action.toLowerCase());
    return [...new Set(actions)];
  }, [allPermissions]);

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={handleCancel}
          className="mr-3 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold">Quản lý quyền cho vai trò: <span className="text-blue-600">{roleName}</span></h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p className="text-gray-700 mb-4">Chọn các quyền bạn muốn gán cho vai trò này:</p>
        
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div> */}
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên chức năng..."
              onChange={handleSearchChange}
              className="px-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative w-full sm:w-64">
            <select
              onChange={handleActionFilterChange}
              className="px-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={actionFilter}
            >
              <option value="all">Tất cả action</option>
              {availableActions.map(action => (
                <option key={action} value={action}>{action.charAt(0).toUpperCase() + action.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tên chức năng</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Quyền</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Chọn</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map(permission => (
                <tr key={permission.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">{permission.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(permission.action)}`}>
                      {permission.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(permission.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedPermissions.includes(permission.id) 
                          ? 'text-green-600 hover:text-green-800' 
                          : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {selectedPermissions.includes(permission.id) ? (
                          <CheckCircle size={24} />
                        ) : (
                          <PlusCircle size={24} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPermissions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    Không có quyền hạn nào khả dụng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={savePermissions}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
} 