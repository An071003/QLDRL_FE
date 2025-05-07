'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Loading from './Loading';

interface Props {
  studentId: string | null;
  onClose: () => void;
}

export default function StudentActivityModal({ studentId, onClose }: Props) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studentId) fetchActivities();
  }, [studentId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/students/${studentId}/activities`);
      setActivities(res.data.data.activities);
    } catch (err) {
      console.error('Lỗi khi lấy hoạt động');
    } finally {
      setLoading(false);
    }
  };

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Danh sách hoạt động đã tham gia</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-xl font-bold">
            &times;
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : activities.length === 0 ? (
          <p className="text-gray-600">Chưa có hoạt động nào được ghi nhận trong học kỳ mới nhất.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên hoạt động</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chiến dịch</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Điểm</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activities.map((a, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{a.activity_name}</td>
                  <td className="px-4 py-2">{a.campaign_name}</td>
                  <td className="px-4 py-2 text-center">{a.awarded_score}</td>
                  <td className="px-4 py-2 text-center">{new Date(a.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
