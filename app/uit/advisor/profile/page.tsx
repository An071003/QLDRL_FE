"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { Advisor } from "@/types/advisor";
import { Class } from "@/types/class";
import AdvisorClasses from "@/components/AdvisorClasses";

export default function AdvisorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const fetchAdvisorProfile = async () => {
      setLoading(true);
      try {
        // Fetch current user info
        const userRes = await api.get('/api/auth/me');
        if (!userRes.data?.data?.user?.id) {
          toast.error("Không thể lấy thông tin người dùng");
          return;
        }

        // Fetch advisor details with the user ID
        const advisorRes = await api.get(`/api/advisors/user/${userRes.data.data.user.id}`);
        if (advisorRes.data?.advisor) {
          setAdvisor(advisorRes.data.advisor);
          if (advisorRes.data.advisor.Classes && Array.isArray(advisorRes.data.advisor.Classes)) {
            setClasses(advisorRes.data.advisor.Classes);
          } else if (advisorRes.data.advisor.Class && Array.isArray(advisorRes.data.advisor.Class)) {
            setClasses(advisorRes.data.advisor.Class);
          }
        } else {
          toast.error("Không tìm thấy thông tin cố vấn học tập");
          setAdvisor(null);
        }
      } catch (err) {
        console.error("Failed to fetch advisor profile:", err);
        toast.error("Không thể tải thông tin cá nhân");
        setAdvisor(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdvisorProfile();
  }, []);


  if (loading) return <Loading />;

  if (!advisor) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin cố vấn học tập</h1>
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
            <p className="text-gray-500 mb-1">Tên cố vấn</p>
            <p className="font-medium">{advisor.name || 'Chưa có tên'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="font-medium">{advisor.User?.email || 'Chưa có'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Số điện thoại</p>
            <p className="font-medium">{advisor.phone || 'Chưa có'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Khoa</p>
            <p className="font-medium">{advisor.Faculty?.name || advisor.Faculty?.faculty_name || 'Chưa phân công'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Mã Khoa</p>
            <p className="font-medium">{advisor.Faculty?.faculty_abbr || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Danh sách lớp phụ trách</h2>
        <div className="rounded-md overflow-hidden">
          {classes.length > 0 ? (
            <AdvisorClasses classes={classes} />
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa được phân công lớp nào</p>
          )}
        </div>
      </div>
    </div>
  );
} 