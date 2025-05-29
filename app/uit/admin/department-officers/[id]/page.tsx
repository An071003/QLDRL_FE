'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';

interface DepartmentOfficer {
  id: number;
  officer_name: string;
  officer_phone: string;
  User?: {
    email: string;
    user_name: string;
  };
}

export default function DepartmentOfficerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [officer, setOfficer] = useState<DepartmentOfficer | null>(null);
  const [loading, setLoading] = useState(true);
  const officerId = params?.id as string;

  const fetchOfficerDetail = useCallback(async () => {
    if (!officerId) return;
    try {
      const res = await api.get(`/api/department-officers/${officerId}`);
      if (res.data.officer) {
        setOfficer(res.data.officer);
      } else {
        toast.error('Không tìm thấy cán bộ khoa');
        router.push('/uit/admin/department-officers');
      }
    } catch (err) {
      console.error('Failed to fetch department officer:', err);
      toast.error('Không thể tải thông tin cán bộ khoa');
      router.push('/uit/admin/department-officers');
    } finally {
      setLoading(false);
    }
  }, [officerId, router]);

  useEffect(() => {
    fetchOfficerDetail();
  }, [fetchOfficerDetail]);

  const handleBackClick = () => {
    router.push('/uit/admin/department-officers');
  };

  if (loading) return <Loading />;

  if (!officer) return null;

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={handleBackClick}
          className="mr-4 hover:text-blue-600 flex items-center"
        >
          <ArrowLeft size={20} className="mr-1" />
          Quay lại
        </button>
        <h1 className="text-3xl font-bold">Chi tiết cán bộ khoa</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Thông tin cá nhân</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Tên cán bộ khoa</div>
                <div className="text-lg">{officer.officer_name || 'Chưa có thông tin'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Số điện thoại</div>
                <div className="text-lg">{officer.officer_phone || 'Chưa có thông tin'}</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Thông tin tài khoản</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Tên đăng nhập</div>
                <div className="text-lg">{officer.User?.user_name || 'Chưa có thông tin'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Email</div>
                <div className="text-lg">{officer.User?.email || 'Chưa có thông tin'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 