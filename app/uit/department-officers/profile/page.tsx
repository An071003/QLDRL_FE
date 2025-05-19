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
  const [userData, setUserData] = useState(null);

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
        console.log("User data:", userRes.data.data.user);

        // Fetch department officer details with the user ID
        const officerRes = await api.get(`/api/department-officers/user/${userRes.data.data.user.id}`);
        if (officerRes.data?.departmentOfficer) {
          console.log("Officer data:", officerRes.data.departmentOfficer);
          setDepartmentOfficer(officerRes.data.departmentOfficer);
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
        <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 mb-1">Tên cán bộ khoa</p>
            <p className="font-medium">{departmentOfficer.officer_name || 'Chưa có tên'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="font-medium">{departmentOfficer.User?.email || (userData as any)?.email || 'Chưa có'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Số điện thoại</p>
            <p className="font-medium">{departmentOfficer.officer_phone || 'Chưa có'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Tên đăng nhập</p>
            <p className="font-medium">{departmentOfficer.User?.user_name || (userData as any)?.user_name || 'Chưa có'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 