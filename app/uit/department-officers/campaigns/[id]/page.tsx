'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Space, Button, Tooltip, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';

interface Activity {  id: number;  name: string;  point: number;  max_participants?: number;  number_students: number;  status: "ongoing" | "expired";  registration_start?: string;  registration_end?: string;  campaign_id: number;  approver_id: number | null;}

interface Campaign {
  id: number;
  name: string;
  max_score: number;
  semester_no: number;
  academic_year: string;
  Criteria?: {
    id: number;
    name: string;
  };
}

type TableRecord = Record<string, unknown>;

export default function DPOCampaignActivitiesPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchCampaignAndActivities = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch campaign details
      const campaignRes = await api.get(`/api/campaigns/${campaignId}`);
      setCampaign(campaignRes.data.data.campaign);
      
      // Fetch activities by campaign ID directly from backend
      const activitiesRes = await api.get(`/api/activities/campaign/${campaignId}`);
      const activities = activitiesRes.data.data.activities || [];
      
      setActivities(activities);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Không thể tải dữ liệu phong trào và hoạt động');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignAndActivities();
    }
  }, [campaignId, fetchCampaignAndActivities]);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleSortPoint = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const filteredActivities = useMemo(() => {
    return activities
      .filter((activity) => 
        activity.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortOrder === "asc") {
          return a.point - b.point;
        } else {
          return b.point - a.point;
        }
      });
  }, [activities, searchTerm, sortOrder]);

  const columns = [
    {
      title: 'STT',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: Activity, b: Activity) => a.id - b.id,
    },
    {
      title: 'Tên hoạt động',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Activity, b: Activity) => a.name.localeCompare(b.name),
      render: (text: string) => (
        <Tooltip title={text}>
          <div className="max-w-xs truncate">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: <span className="cursor-pointer" onClick={handleSortPoint}>Điểm {sortOrder === "asc" ? "▲" : "▼"}</span>,
      dataIndex: 'point',
      key: 'point',
    },
    {
      title: 'Số sinh viên',
      key: 'number_students',
      render: (_: TableRecord, record: Activity) => record.number_students || 0,
    },
    {
      title: 'Thời gian đăng ký',
      key: 'registration_time',
      render: (_: TableRecord, record: Activity) => {
        if (!record.registration_start || !record.registration_end) return 'N/A';
        return (
          <div>
            <div>Bắt đầu: {new Date(record.registration_start).toLocaleDateString('vi-VN')}</div>
            <div>Kết thúc: {new Date(record.registration_end).toLocaleDateString('vi-VN')}</div>
          </div>
        );
      }
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: TableRecord, record: Activity) => (
        <Tag color={record.status === "ongoing" ? "green" : "gray"}>
          {record.status === "ongoing" ? "Đang diễn ra" : "Đã kết thúc"}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: TableRecord, record: Activity) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => router.push(`/uit/department-officers/activities/${record.id}`)}
          >
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold max-w-5xl">Hoạt động thuộc phong trào {campaign?.name}</h1>
        <button
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          onClick={() => window.history.back()}>
          Quay về danh sách
        </button>
      </div>

      {campaign && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500">Tên phong trào:</p>
              <p className="font-medium">{campaign.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Tiêu chí:</p>
              <p className="font-medium">{campaign.Criteria?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Điểm tối đa:</p>
              <p className="font-medium">{campaign.max_score}</p>
            </div>
            <div>
              <p className="text-gray-500">Học kỳ:</p>
              <p className="font-medium">Học kỳ {campaign.semester_no} - {campaign.academic_year}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoạt động..."
          onChange={handleSearchChange}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <Table 
          columns={columns} 
          dataSource={filteredActivities}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Không có hoạt động nào trong phong trào này' }}
        />
      </div>
    </div>
  );
} 