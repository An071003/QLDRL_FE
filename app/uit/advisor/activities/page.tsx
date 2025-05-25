'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { useRouter } from 'next/navigation';
import { Tabs, Tab } from "@/components/Tabs";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";
import { jwtVerify } from 'jose';
import ActivityForm from "@/components/form/ActivityForm";
import ActivityImport from "@/components/Import/ActivityImport";
import ActivityTable from "@/components/activities/ActivityTable";

export default function AdvisorActivityManagement() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [createdPendingActivities, setCreatedPendingActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>('point');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("approved");
  const [activeComponent, setActiveComponent] = useState<"form" | "import" | "table">("table");
  const itemsPerPage = 10; const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function verifyToken() {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
  
      if (token) {
        try {
          const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET as string);
          const { payload } = await jwtVerify(token, secret);
          setCurrentUserId(payload.id as number);
        } catch (error) {
          console.error("Error verifying token:", error);
        }
      }
    }
  
    verifyToken();
  }, []);

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const campaignsRes = await api.get("/api/campaigns");
      const campaignsData = campaignsRes.data.data.campaigns || campaignsRes.data.data || [];
      setCampaigns(campaignsData);
      
      // Get all activities
      const activitiesRes = await api.get("/api/activities");
      let allActivities;

      if (activitiesRes.data.data.activities) {
        allActivities = activitiesRes.data.data.activities;
      } else {
        allActivities = activitiesRes.data.data || [];
      }

      const approved = allActivities.filter((activity: Activity) => activity.approver_id !== null);
      setActivities(approved);

      const createdPendingRes = await api.get("/api/activities/created-pending");
      let pendingData;
      
      if (createdPendingRes.data.data.activities) {
        pendingData = createdPendingRes.data.data.activities;
      } else {
        pendingData = createdPendingRes.data.data || [];
      }
      
      setCreatedPendingActivities(pendingData);
    } catch (error) {
      toast.error("Không thể tải dữ liệu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (newActivity: {
    name: string;
    point: number;
    campaign_id: number;
    max_participants?: number;
    registration_start?: string;
    registration_end?: string;
  }) => {
    const campaign = campaigns.find(c => c.id === newActivity.campaign_id);
    if (campaign && newActivity.point > (campaign?.max_score || 0)) {
      toast.error(`Điểm hoạt động không được lớn hơn điểm tối đa (${campaign.max_score}) của phong trào.`);
      return { success: false };
    }
    
    if (!newActivity.registration_start || !newActivity.registration_end) {
      toast.error("Ngày bắt đầu và kết thúc đăng ký là bắt buộc.");
      return { success: false };
    }
    
    if (newActivity.max_participants === undefined) {
      newActivity.max_participants = 0; 
    }
    
    try {
      await api.post("/api/activities", newActivity);
      await loadData();
      setActiveComponent("table");
      toast.success("Thêm hoạt động thành công 🎉");
      return { success: true };
    } catch (error) {
      console.error(error);
      toast.error("Thêm hoạt động thất bại ❌");
      return { success: false };
    }
  };

  const handleActivitiesImported = async (importedActivities: {
    name: string;
    point: number;
    campaign_id: number;
    max_participants: number;
    registration_start: string;
    registration_end: string;
    status?: string;
  }[]) => {
    try {
      await api.post("/api/activities/import", importedActivities);
      await loadData();
      setActiveComponent("table");
      toast.success("Import hoạt động thành công 🚀");
      return { success: true };
    } catch (error) {
      console.error(error);
      toast.error("Import hoạt động thất bại ❌");
      return { success: false };
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
    const filtered = activities
      .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((activity) => {
        if (selectedSemester === "all") return true;
        const campaign = campaigns.find(c => c.id === activity.campaign_id);
        if (!campaign) return false;
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
          case 'semester':
            const campaignASem = campaigns.find(c => c.id === a.campaign_id);
            const campaignBSem = campaigns.find(c => c.id === b.campaign_id);
            valueA = campaignASem ? `${campaignASem.semester_no}_${campaignASem.academic_year}` : '';
            valueB = campaignBSem ? `${campaignBSem.semester_no}_${campaignBSem.academic_year}` : '';
            break;
          case 'point':
            valueA = a.point || 0;
            valueB = b.point || 0;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          case 'number_students':
            valueA = a.number_students || 0;
            valueB = b.number_students || 0;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          case 'max_participants':
            valueA = a.max_participants || 0;
            valueB = b.max_participants || 0;
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

  const sortedAndFilteredPendingActivities = useMemo(() => {
    // Filter by search term and semester
    const filtered = createdPendingActivities
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
        let valueA: string | number;
        let valueB: string | number;

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
  }, [createdPendingActivities, campaigns, searchTerm, selectedSemester, sortField, sortDirection]);

  const totalPages = Math.ceil(
    activeTab === "approved" 
      ? sortedAndFilteredActivities.length / itemsPerPage
      : sortedAndFilteredPendingActivities.length / itemsPerPage
  );
  
  const paginatedActivities = activeTab === "approved"
    ? sortedAndFilteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : sortedAndFilteredPendingActivities.slice(
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

  const renderMainContent = () => {
    switch (activeComponent) {
      case "form":
        return <ActivityForm currentcampaigns={campaigns} onActivityCreated={handleCreateActivity} />;
      case "import":
        return <ActivityImport onActivitiesImported={handleActivitiesImported} currentcampaigns={campaigns} />;
      default:
        return (
          <>
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
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setActiveComponent("form")}
                  className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + Thêm hoạt động
                </button>
                <button
                  onClick={() => setActiveComponent("import")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Import hoạt động
                </button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <Tab value="approved" title="Đã phê duyệt">
                <ActivityTable
                  activities={sortedAndFilteredActivities}
                  campaigns={campaigns}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={sortedAndFilteredActivities.length}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onPageChange={setCurrentPage}
                  onViewDetails={(id) => router.push(`/uit/advisor/activities/${id}`)}
                />
              </Tab>
              <Tab value="pending" title="Chờ phê duyệt">
                <ActivityTable
                  activities={sortedAndFilteredPendingActivities}
                  campaigns={campaigns}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={sortedAndFilteredPendingActivities.length}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onPageChange={setCurrentPage}
                  onViewDetails={(id) => router.push(`/uit/advisor/activities/${id}`)}
                  isPending={true}
                />
              </Tab>
            </Tabs>
          </>
        );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý hoạt động</h1>
      {activeComponent !== "table" && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setActiveComponent("table")}
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay về danh sách
          </button>
        </div>
      )}
      {renderMainContent()}
    </div>
  );
} 