"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { toast } from "sonner";

interface DepartmentOfficer {
  id: number;
  officer_name: string;
  officer_phone?: string;
  user_id?: number;
  User?: {
    id?: number;
    email?: string;
    user_name?: string;
  };
}

export default function DepartmentOfficerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [departmentOfficer, setDepartmentOfficer] = useState<DepartmentOfficer | null>(null);
  const [userData, setUserData] = useState<{ email?: string; user_name?: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    const fetchDepartmentOfficerProfile = async () => {
      setLoading(true);
      try {
        // Fetch current user info
        const userRes = await api.get('/api/auth/me');
        if (!userRes.data?.data?.user?.id) {
          toast.error("Không thể lấy thông tin người dùng");
          return;
        }

        setUserData(userRes.data.data.user);

        // Fetch department officer details with the user ID
        const officerRes = await api.get(`/api/department-officers/user/${userRes.data.data.user.id}`);
        if (officerRes.data?.departmentOfficer) {
          setDepartmentOfficer(officerRes.data.departmentOfficer);
          setEditName(officerRes.data.departmentOfficer.officer_name || '');
          setEditPhone(officerRes.data.departmentOfficer.officer_phone || '');
        } else {
          toast.error("Không tìm thấy thông tin cán bộ khoa");
          setDepartmentOfficer(null);
        }
      } catch (err) {
        console.error("Failed to fetch department officer profile:", err);
        toast.error("Không thể tải thông tin cá nhân");
        setDepartmentOfficer(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDepartmentOfficerProfile();
  }, []);

  const handleSave = async () => {
    if (!departmentOfficer) return;

    if (!editName.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    if (editPhone && !/^\d{10}$/.test(editPhone)) {
      toast.error("Số điện thoại không hợp lệ (phải có 10 chữ số)");
      return;
    }

    try {
      await api.put(`/api/department-officers/${departmentOfficer.id}`, {
        officer_name: editName,
        officer_phone: editPhone
      });

      setDepartmentOfficer({
        ...departmentOfficer,
        officer_name: editName,
        officer_phone: editPhone
      });

      setIsEditing(false);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error("Failed to update department officer:", error);
      toast.error("Không thể cập nhật thông tin");
    }
  };

  if (loading) return <Loading />;

  if (!departmentOfficer) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin cán bộ khoa</h1>
        <pre className="mt-4 text-xs bg-gray-100 p-4 rounded text-left overflow-auto max-h-96">
          User data: {JSON.stringify(userData, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Thông tin cá nhân</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Thông tin cơ bản</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Chỉnh sửa
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Lưu
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(departmentOfficer.officer_name || '');
                  setEditPhone(departmentOfficer.officer_phone || '');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Hủy
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 mb-1">Tên cán bộ khoa</p>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên cán bộ khoa"
              />
            ) : (
              <p className="font-medium">{departmentOfficer.officer_name || 'Chưa có tên'}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="font-medium">{departmentOfficer.User?.email || userData?.email || 'Chưa có'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Số điện thoại</p>
            {isEditing ? (
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số điện thoại"
              />
            ) : (
              <p className="font-medium">{departmentOfficer.officer_phone || 'Chưa có'}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 mb-1">Tên đăng nhập</p>
            <p className="font-medium">{departmentOfficer.User?.user_name || userData?.user_name || 'Chưa có'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 