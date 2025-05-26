"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { Advisor } from "@/types/advisor";
import { Class } from "@/types/class";
import AdvisorClasses from "@/components/AdvisorClasses";
import { useRouter } from "next/navigation";

export default function AdvisorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchAdvisorProfile = async () => {
      setLoading(true);
      try {
        const userRes = await api.get('/api/auth/me');
        if (!userRes.data?.data?.user?.id) {
          toast.error("Không thể lấy thông tin người dùng");
          return;
        }

        // Fetch advisor details with the user ID
        const advisorRes = await api.get(`/api/advisors/user/${userRes.data.data.user.id}`);
        if (advisorRes.data?.advisor) {
          setAdvisor(advisorRes.data.advisor);
          setEditName(advisorRes.data.advisor.name || '');
          setEditPhone(advisorRes.data.advisor.phone || '');
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

  const handleViewDetail = (classId: number) => {
    router.push(`/uit/advisor/classes/${classId}`);
  };

  const handleSave = async () => {
    if (!advisor) return;

    if (!editName.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    if (editPhone && !/^\d{10}$/.test(editPhone)) {
      toast.error("Số điện thoại không hợp lệ (phải có 10 chữ số)");
      return;
    }

    try {
      await api.put(`/api/advisors/${advisor.id}`, {
        name: editName,
        phone: editPhone,
        faculty_id: advisor.faculty_id
      });

      setAdvisor({
        ...advisor,
        name: editName,
        phone: editPhone
      });

      setIsEditing(false);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error("Failed to update advisor:", error);
      toast.error("Không thể cập nhật thông tin");
    }
  };

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
                  setEditName(advisor.name || '');
                  setEditPhone(advisor.phone || '');
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
            <p className="text-gray-500 mb-1">Tên cố vấn</p>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên cố vấn"
              />
            ) : (
              <p className="font-medium">{advisor.name || 'Chưa có tên'}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="font-medium">{advisor.User?.email || 'Chưa có'}</p>
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
              <p className="font-medium">{advisor.phone || 'Chưa có'}</p>
            )}
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
            <AdvisorClasses classes={classes} handleViewDetail={handleViewDetail} />
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa được phân công lớp nào</p>
          )}
        </div>
      </div>
    </div>
  );
} 