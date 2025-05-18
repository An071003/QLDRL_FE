'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
import { Table, Tag, Input } from 'antd';
import debounce from 'lodash.debounce';

interface StudentActivity {
  id: number;
  student_id: string;
  student_name: string;
  class?: string;
  faculty?: string;
  participated: boolean;
}

export default function AdvisorActivityStudentsPage() {
  const params = useParams();
  const activityId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);
  const [search, setSearch] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [activityId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch activity details
      const activityRes = await api.get(`/api/activities/${activityId}`);
      setActivity(activityRes.data.data.activity);

      // Fetch students in this activity
      const studentsRes = await api.get(`/api/activities/${activityId}/students`);
      setStudents(studentsRes.data.data.students || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Không thể tải dữ liệu hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce((value: string) => {
    setSearch(value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filtered = students.filter(s => 
    s.student_id?.toLowerCase().includes(search.toLowerCase()) || 
    s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.class?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'STT',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 70
    },
    {
      title: 'MSSV',
      dataIndex: 'student_id',
      key: 'student_id',
      sorter: (a: StudentActivity, b: StudentActivity) => 
        (a.student_id || '').localeCompare(b.student_id || '')
    },
    {
      title: 'Tên sinh viên',
      dataIndex: 'student_name',
      key: 'student_name',
      sorter: (a: StudentActivity, b: StudentActivity) => 
        (a.student_name || '').localeCompare(b.student_name || '')
    },
    {
      title: 'Lớp',
      dataIndex: 'class',
      key: 'class'
    },
    {
      title: 'Trạng thái tham gia',
      key: 'participated',
      render: (_: any, record: StudentActivity) => (
        <Tag color={record.participated ? 'green' : 'gray'}>
          {record.participated ? 'Đã tham gia' : 'Chưa tham gia'}
        </Tag>
      ),
      filters: [
        { text: 'Đã tham gia', value: true },
        { text: 'Chưa tham gia', value: false }
      ],
      onFilter: (value: boolean | string | number, record: StudentActivity) => 
        record.participated === value
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {activity?.name || 'Chi tiết hoạt động'}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Tên hoạt động:</p>
            <p className="font-medium">{activity?.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Điểm:</p>
            <p className="font-medium">{activity?.point}</p>
          </div>
          <div>
            <p className="text-gray-500">Phong trào:</p>
            <p className="font-medium">{activity?.Campaign?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Trạng thái:</p>
            <p className="font-medium">
              <Tag color={activity?.status === 'ongoing' ? 'green' : 'gray'}>
                {activity?.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
              </Tag>
            </p>
          </div>
          <div>
            <p className="text-gray-500">Bắt đầu đăng ký:</p>
            <p className="font-medium">
              {activity?.registration_start ? new Date(activity.registration_start).toLocaleDateString('vi-VN') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Kết thúc đăng ký:</p>
            <p className="font-medium">
              {activity?.registration_end ? new Date(activity.registration_end).toLocaleDateString('vi-VN') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Danh sách sinh viên tham gia</h2>
        <div className="flex gap-4">
          <button
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
            onClick={() => window.history.back()}>
            Quay về danh sách
          </button>
        </div>
      </div>

      <div className="mb-4">
        <Input.Search
          placeholder="Tìm kiếm theo MSSV, tên hoặc lớp..."
          onChange={handleSearchChange}
          allowClear
          className="max-w-md"
        />
      </div>

      <div ref={tableRef} className="bg-white rounded-lg shadow overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Không có sinh viên nào' }}
        />
      </div>
    </div>
  );
} 