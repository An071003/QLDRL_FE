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
import { useData } from "@/lib/contexts/DataContext";

interface SemesterOption {
  value: string;
  label: string;
  semester_no: number;
  academic_year: number;
}

export default function AdvisorActivityManagement() {
  const router = useRouter();
  const { 
    campaigns: contextCampaigns, 
    semesterOptions: contextSemesterOptions,
    currentSemester: contextCurrentSemester,
    setCurrentSemester: setContextCurrentSemester,
    loading: dataLoading
  } = useData();
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [createdPendingActivities, setCreatedPendingActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>('point');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("approved");
  const [activeComponent, setActiveComponent] = useState<"form" | "import" | "table">("table");
  
  // Separate state for current semester campaigns (for forms)
  const [currentSemesterCampaigns, setCurrentSemesterCampaigns] = useState<Campaign[]>([]);
  
  const tableRef = useRef<HTMLDivElement>(null);

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
    if (contextCurrentSemester && !selectedSemester) {
      setSelectedSemester(contextCurrentSemester);
    }
  }, [contextCurrentSemester, selectedSemester]);

  // Fetch current semester campaigns when semester options are available
  useEffect(() => {
    if (contextSemesterOptions.length > 0) {
      fetchCurrentSemesterCampaigns();
    }
  }, [contextSemesterOptions]);

  useEffect(() => {
    if (selectedSemester) {
      fetchAllActivitiesBySemester(selectedSemester);
    }
  }, [selectedSemester, currentUserId]);

  // Fetch all activities for a semester and split into approved/pending
  const fetchAllActivitiesBySemester = async (semester: string) => {
    if (!semester) return;
    
    setLoadingActivities(true);
    try {
      const [semester_no, academic_year] = semester.split('_');
      const url = `/api/activities?semester_no=${semester_no}&academic_year=${academic_year}`;
      
      const activitiesRes = await api.get(url);
      const allActivities = activitiesRes.data.data.activities || [];

      // Split into approved and pending
      const approved = allActivities.filter((activity: Activity) => activity.approver_id !== null);
      const pending = allActivities.filter((activity: Activity) => activity.approver_id === null);
      
      setActivities(approved);
      setCreatedPendingActivities(pending);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Không thể tải danh sách hoạt động');
    } finally {
      setLoadingActivities(false);
    }
  };

  // Handle semester change
  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setContextCurrentSemester(semester);
  };

  const handleCreateActivity = async (newActivity: {
    name: string;
    point: number;
    campaign_id: number;
    max_participants?: number;
    registration_start?: string;
    registration_end?: string;
  }) => {
    const campaign = currentSemesterCampaigns.find(c => c.id === newActivity.campaign_id);
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
      // Reload both approved and pending activities
      if (selectedSemester) {
        await fetchAllActivitiesBySemester(selectedSemester);
      }
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
      // Reload both approved and pending activities
      if (selectedSemester) {
        await fetchAllActivitiesBySemester(selectedSemester);
      }
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
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredActivities = useMemo(() => {
    // Filter by search term only (semester already filtered in API)
    const filtered = activities
      .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
            const campaignA = contextCampaigns.find(c => c.id === a.campaign_id);
            const campaignB = contextCampaigns.find(c => c.id === b.campaign_id);
            valueA = campaignA?.name || '';
            valueB = campaignB?.name || '';
            break;
          case 'semester':
            const campaignASem = contextCampaigns.find(c => c.id === a.campaign_id);
            const campaignBSem = contextCampaigns.find(c => c.id === b.campaign_id);
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
  }, [activities, contextCampaigns, searchTerm, sortField, sortDirection]);

  const sortedAndFilteredPendingActivities = useMemo(() => {

    const filtered = createdPendingActivities
      .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
            const campaignA = contextCampaigns.find(c => c.id === a.campaign_id);
            const campaignB = contextCampaigns.find(c => c.id === b.campaign_id);
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
  }, [createdPendingActivities, contextCampaigns, searchTerm, selectedSemester, sortField, sortDirection]);

  // Fetch campaigns for the latest semester (for forms)
  const fetchCurrentSemesterCampaigns = async () => {
    if (contextSemesterOptions.length === 0) return;
    
    try {
      // Get the latest semester (first in the list)
      const latestSemester = contextSemesterOptions[0];
      const [semester_no, academic_year] = latestSemester.value.split('_');
      
      const res = await api.get(`/api/campaigns/semester/${semester_no}/${academic_year}`);
      const campaignsData = res.data.data.campaigns || [];
      setCurrentSemesterCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching current semester campaigns:', error);
    }
  };

  if (dataLoading) {
    return (
      <Loading />
    );
  }

  const renderMainContent = () => {
    switch (activeComponent) {
      case "form":
        return <ActivityForm currentcampaigns={currentSemesterCampaigns} onActivityCreated={handleCreateActivity} />;
      case "import":
        return <ActivityImport onActivitiesImported={handleActivitiesImported} currentcampaigns={currentSemesterCampaigns} />;
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
                  handleSemesterChange(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
                disabled={contextSemesterOptions.length === 0}
              >
                {contextSemesterOptions.length === 0 ? (
                  <option value="">Đang tải học kỳ...</option>
                ) : (
                  <>
                    {!selectedSemester && (
                      <option value="">-- Chọn học kỳ --</option>
                    )}
                    {contextSemesterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </>
                )}
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
                {loadingActivities ? (
                  <Loading />
                ) : (
                  <ActivityTable
                    activities={sortedAndFilteredActivities}
                    campaigns={contextCampaigns}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onViewDetails={(id) => router.push(`/uit/advisor/activities/${id}`)}
                  />
                )}
              </Tab>
              <Tab value="pending" title="Chờ phê duyệt">
                <ActivityTable
                  activities={sortedAndFilteredPendingActivities}
                  campaigns={contextCampaigns}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
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