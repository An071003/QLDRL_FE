'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { useRouter } from 'next/navigation';
import debounce from 'lodash.debounce';
import { Tabs, Tab } from "@/components/Tabs";

interface Activity {  id: number;  name: string;  point: number;  max_participants?: number;  number_students: number;  status: "ongoing" | "expired";  registration_start?: string;  registration_end?: string;  campaign_id: number;  approver_id: number | null;  Campaign?: {    name: string;    semester_no: number;    academic_year: string;  };}

interface Campaign {
  id: number;
  name: string;
  semester_no: number;
  academic_year: string;
}

export default function AdvisorActivityManagement() {  const router = useRouter();  const [activities, setActivities] = useState<Activity[]>([]);  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);  const [campaigns, setCampaigns] = useState<Campaign[]>([]);  const [loading, setLoading] = useState(true);  const [searchTerm, setSearchTerm] = useState("");  const [sortField, setSortField] = useState<string | null>('point');  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');  const [selectedSemester, setSelectedSemester] = useState<string>("all");  const [currentPage, setCurrentPage] = useState(1);  const [activeTab, setActiveTab] = useState<string>("approved");  const itemsPerPage = 10;  const tableRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Tải campaigns trước
      const campaignsRes = await api.get("/api/campaigns");
      const campaignsData = campaignsRes.data.data.campaigns || campaignsRes.data.data || [];
      setCampaigns(campaignsData);
      
      // Sau đó tải toàn bộ activities
      const activitiesRes = await api.get("/api/activities");
      let allActivities;
      
      if (activitiesRes.data.data.activities) {
        allActivities = activitiesRes.data.data.activities;
      } else {
        allActivities = activitiesRes.data.data || [];
      }
      
      // Phân loại activities thành đã duyệt và chưa duyệt
      const approved = allActivities.filter((activity: Activity) => activity.approver_id !== null);
      const pending = allActivities.filter((activity: Activity) => activity.approver_id === null);
      
      setActivities(approved);
      setPendingActivities(pending);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const semesterOptions = useMemo(() => {
    const options = new Set<string>();
    campaigns.forEach(campaign => {
      options.add(`${campaign.semester_no}_${campaign.academic_year}`);
    });
    
    return Array.from(options).map(option => {
      const [semester_no, academic_year] = option.split('_');
      return {
        value: option,
        label: `Học kỳ ${semester_no} - ${academic_year}`
      };
    }).sort((a, b) => a.label.localeCompare(b.label));
  }, [campaigns]);

  const sortedAndFilteredActivities = useMemo(() => {
    // Filter by search term and semester
    const filtered = activities
      .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((activity) => {
        if (selectedSemester === "all") return true;
        
        // Find campaign for the activity
        const campaign = campaigns.find(c => c.id === activity.campaign_id);
        if (!campaign) return false;
        
        // Check if campaign matches selected semester
        const [semester_no, academic_year] = selectedSemester.split("_");
        return campaign.semester_no?.toString() === semester_no && 
               campaign.academic_year?.toString() === academic_year;
      });

    // Apply sorting
    if (sortField) {
      return [...filtered].sort((a, b) => {
        let valueA: any;
        let valueB: any;
        
        switch (sortField) {
          case 'id':
            valueA = a.id;
            valueB = b.id;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          case 'name':
            valueA = a.name || '';
            valueB = b.name || '';
            break;
          case 'campaign':
            const campaignA = campaigns.find(c => c.id === a.campaign_id);
            const campaignB = campaigns.find(c => c.id === b.campaign_id);
            valueA = campaignA?.name || '';
            valueB = campaignB?.name || '';
            break;
          case 'point':
            valueA = a.point || 0;
            valueB = b.point || 0;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          case 'number_students':
            valueA = a.number_students || 0;
            valueB = b.number_students || 0;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          default:
            return 0;
        }
        
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortDirection === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        return 0;
      });
    }
    
    return filtered;
  }, [activities, campaigns, searchTerm, selectedSemester, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedAndFilteredActivities.length / itemsPerPage);
  const paginatedActivities = sortedAndFilteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      tableRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý hoạt động</h1>
      
      <div ref={tableRef} className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm theo tên hoạt động..."
          className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
        />
        <select
          value={selectedSemester}
          onChange={(e) => {
            setSelectedSemester(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
        >
          <option value="all">Tất cả học kỳ</option>
          {semesterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tab value="approved" title="Đã phê duyệt">
          <div className="mt-4 bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      STT
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Tên hoạt động {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('campaign')}
                    >
                      Phong trào {sortField === 'campaign' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      Học kỳ
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('point')}
                    >
                      Điểm {sortField === 'point' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort('number_students')}
                    >
                      Số sinh viên {sortField === 'number_students' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      Trạng thái
                    </th>
                    <th 
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedActivities.map((activity, index) => {
                    const campaign = campaigns.find(c => c.id === activity.campaign_id);
                    return (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="max-w-xs truncate" title={activity.name}>{activity.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {campaign?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {campaign ? `Học kỳ ${campaign.semester_no} - ${campaign.academic_year}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{activity.point}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{activity.number_students || 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded inline-flex text-xs leading-5 font-semibold ${
                            activity.status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/uit/advisor/activities/${activity.id}`)}
                            className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, sortedAndFilteredActivities.length)}
                      </span>{' '}
                      trong tổng số <span className="font-medium">{sortedAndFilteredActivities.length}</span> hoạt động
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        &laquo;
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                            page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        &raquo;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tab>
        <Tab value="pending" title={`Chờ phê duyệt (${pendingActivities.length})`}>
          <div className="mt-4 bg-white rounded-lg shadow overflow-hidden mb-6">
            {pendingActivities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tên hoạt động
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Phong trào
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Học kỳ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Điểm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingActivities.map((activity, index) => {
                      const campaign = campaigns.find(c => c.id === activity.campaign_id);
                      return (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="max-w-xs truncate" title={activity.name}>{activity.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {campaign?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {campaign ? `Học kỳ ${campaign.semester_no} - ${campaign.academic_year}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{activity.point}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 rounded inline-flex text-xs leading-5 font-semibold bg-yellow-100 text-yellow-800">
                              Chờ duyệt
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => router.push(`/uit/advisor/activities/${activity.id}`)}
                              className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                Không có hoạt động nào đang chờ phê duyệt
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
} 