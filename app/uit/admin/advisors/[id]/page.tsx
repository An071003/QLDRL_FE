"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { Advisor } from "@/types/advisor";
import { Class } from "@/types/class";
import AdvisorClasses from "@/components/AdvisorClasses";

export default function AdvisorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const advisorId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const fetchAdvisorDetails = async () => {
      if (!advisorId) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/advisors/${advisorId}`);
        if (res.data.advisor) {
          setAdvisor(res.data.advisor);
          if (res.data.advisor.Class && Array.isArray(res.data.advisor.Class)) {
            setClasses(res.data.advisor.Class);
          }
        } else {
          toast.error("Không tìm thấy thông tin cố vấn học tập");
          setAdvisor(null);
        }
      } catch (err) {
        console.error("Failed to fetch advisor details:", err);
        toast.error("Không thể tải thông tin cố vấn học tập");
        setAdvisor(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdvisorDetails();
  }, [advisorId]);

  const handleEditAdvisor = () => {
    toast.info("Tính năng đang được phát triển");
  };

  if (loading) return <Loading />;

  if (!advisor) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin cố vấn học tập</h1>
        <button
          className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={() => router.push('/uit/admin/advisors')}
        >
          Quay về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thông tin cố vấn học tập</h1>
      
      <div className="flex justify-end gap-4 mb-6">
        <button
          className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={handleEditAdvisor}
        >
          Chỉnh sửa
        </button>
        <button
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          onClick={() => router.push('/uit/admin/advisors')}
        >
          Quay về danh sách
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 mb-1">Tên cố vấn</p>
            <p className="font-medium">{advisor.name || 'Chưa có tên'}</p>
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
          <AdvisorClasses classes={classes} />
        </div>
      </div>
    </div>
  );
} 