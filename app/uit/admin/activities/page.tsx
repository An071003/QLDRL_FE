"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import ActivityForm from "@/components/form/ActivityForm";
import ActivityImport from "@/components/Import/ActivityImport";
import ActivityTable from "@/components/Table/ActivityTable";
import PendingActivityTable from "@/components/Table/PendingActivityTable";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Loading from "@/components/Loading";
import { Tabs, Tab } from "@/components/Tabs";
import { useData } from "@/lib/contexts/DataContext";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";

export default function ActivityManagement() {
  const {
    campaigns: contextCampaigns,
    semesterOptions: contextSemesterOptions,
    currentSemester: contextCurrentSemester,
    setCurrentSemester: setContextCurrentSemester,
    refreshCampaigns,
    loading: dataLoading
  } = useData();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingPendingActivities, setLoadingPendingActivities] = useState(false);
  const [activeComponent, setActiveComponent] = useState<"form" | "import" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("approved");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Separate state for current semester campaigns (for forms)
  const [currentSemesterCampaigns, setCurrentSemesterCampaigns] = useState<Campaign[]>([]);

  const itemsPerPage = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  // Fetch campaigns for the latest semester (for forms)
  const fetchCurrentSemesterCampaigns = useCallback(async () => {
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
  }, [contextSemesterOptions]);

  useEffect(() => {
    if (contextCurrentSemester && !selectedSemester) {
      setSelectedSemester(contextCurrentSemester);
    }
  }, [contextCurrentSemester, selectedSemester]);

  useEffect(() => {
    if (contextSemesterOptions.length > 0) {
      fetchCurrentSemesterCampaigns();
    }
  }, [contextSemesterOptions, fetchCurrentSemesterCampaigns]);

  const fetchActivities = useCallback(async (semester: string) => {
    if (!semester) return;

    setLoadingActivities(true);
    try {
      const [semester_no, academic_year] = semester.split('_');
      const url = `/api/activities?semester_no=${semester_no}&academic_year=${academic_year}`;

      const res = await api.get(url);
      const allActivities = res.data.data.activities || [];

      const approvedActivities = allActivities.filter((activity: Activity) => activity.approver_id !== null);
      setActivities(approvedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Không thể tải danh sách hoạt động');
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const fetchPendingActivities = useCallback(async (semester: string) => {
    if (!semester) return;
    setLoadingPendingActivities(true);
    try {
      const [semester_no, academic_year] = semester.split('_');
      const url = `/api/activities?semester_no=${semester_no}&academic_year=${academic_year}`;

      const res = await api.get(url);
      const allActivities = res.data.data.activities || [];

      const pendingData = allActivities.filter((activity: Activity) => activity.approver_id === null);

      const pendingWithCampaign = pendingData.map((activity: Activity) => {
        const campaign = contextCampaigns.find((c) => c.id === activity.campaign_id);
        return {
          ...activity,
          campaign_name: campaign ? campaign.name : "Không xác định",
          semester_no: campaign?.semester_no,
          academic_year: campaign?.academic_year
        };
      });

      setPendingActivities(pendingWithCampaign);
    } catch (error) {
      console.error('Error fetching pending activities:', error);
      toast.error('Không thể tải danh sách hoạt động chờ duyệt');
    } finally {
      setLoadingPendingActivities(false);
    }
  }, [contextCampaigns]);

  // Reload activities when semester changes
  useEffect(() => {
    if (selectedSemester) {
      fetchActivities(selectedSemester);
      fetchPendingActivities(selectedSemester);
      setCurrentPage(1);
    }
  }, [selectedSemester, fetchActivities, fetchPendingActivities]);

  // Tính toán filteredActivities từ search term, campaign, và date range
  const filteredActivities = useMemo(() => {
    return activities
      .filter((activity) => {
        // Search term filter
        const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Campaign filter
        const matchesCampaign = !selectedCampaign || activity.campaign_id.toString() === selectedCampaign;
        
        // Date range filter
        let matchesDateRange = true;
        if (startDate || endDate) {
          const activityStartDate = activity.registration_start ? new Date(activity.registration_start) : null;
          const activityEndDate = activity.registration_end ? new Date(activity.registration_end) : null;
          
          if (startDate && activityStartDate) {
            matchesDateRange = matchesDateRange && activityStartDate >= new Date(startDate);
          }
          if (endDate && activityEndDate) {
            matchesDateRange = matchesDateRange && activityEndDate <= new Date(endDate);
          }
        }
        
        return matchesSearch && matchesCampaign && matchesDateRange;
      })
      .sort((a, b) => {
        if (sortOrder === "asc") {
          return a.point - b.point;
        } else {
          return b.point - a.point;
        }
      });
  }, [activities, searchTerm, sortOrder, selectedCampaign, startDate, endDate]);

  // Tính toán filteredPendingActivities tương tự
  const filteredPendingActivities = useMemo(() => {
    return pendingActivities
      .filter((activity) => {
        // Search term filter
        const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Campaign filter
        const matchesCampaign = !selectedCampaign || activity.campaign_id.toString() === selectedCampaign;
        
        // Date range filter
        let matchesDateRange = true;
        if (startDate || endDate) {
          const activityStartDate = activity.registration_start ? new Date(activity.registration_start) : null;
          const activityEndDate = activity.registration_end ? new Date(activity.registration_end) : null;
          
          if (startDate && activityStartDate) {
            matchesDateRange = matchesDateRange && activityStartDate >= new Date(startDate);
          }
          if (endDate && activityEndDate) {
            matchesDateRange = matchesDateRange && activityEndDate <= new Date(endDate);
          }
        }
        
        return matchesSearch && matchesCampaign && matchesDateRange;
      });
  }, [pendingActivities, searchTerm, selectedCampaign, startDate, endDate]);

  // Tính toán currentActivities và totalPages từ filteredActivities
  const { currentActivities, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredActivities.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const current = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);

    return {
      currentActivities: current,
      totalPages: total
    };
  }, [filteredActivities, currentPage]);

  const handleCreateActivity = async (newActivity: {
    name: string;
    point: number;
    campaign_id: number;
    max_participants?: number;
    registration_start?: string;
    registration_end?: string;
  }) => {
    const campaign = contextCampaigns.find(c => c.id === newActivity.campaign_id);
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
      await fetchActivities(selectedSemester); // Reload activities
      await fetchPendingActivities(selectedSemester); // Reload pending activities
      await refreshCampaigns(); // Refresh campaigns to update activity counts
      setActiveComponent("table");
      toast.success("Thêm hoạt động thành công 🎉");
      return { success: true };
    } catch (error) {
      console.error(error);
      toast.error("Thêm hoạt động thất bại ❌");
      return { success: false };
    }
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedId === null) return;
    try {
      await api.delete(`/api/activities/${selectedId}`);
      await fetchActivities(selectedSemester); // Reload activities
      await fetchPendingActivities(selectedSemester); // Reload pending activities
      await refreshCampaigns(); // Refresh campaigns to update activity counts
      toast.success("Xóa hoạt động thành công ✅");
    } catch (error) {
      console.error(error);
      toast.error("Xóa hoạt động thất bại ❌");
    } finally {
      setModalOpen(false);
      setSelectedId(null);
    }
  };

  const handleUpdateActivity = async (
    id: number,
    updatedActivity: {
      name: string;
      point: number;
      campaign_id: number;
      negativescore?: number;
      status: "ongoing" | "expired";
      max_participants?: number;
      registration_start?: string;
      registration_end?: string;
    }
  ) => {
    const campaign = contextCampaigns.find(c => c.id === updatedActivity.campaign_id);
    if (campaign && updatedActivity.point > (campaign?.max_score || 0)) {
      toast.error(`Điểm hoạt động không được lớn hơn điểm tối đa (${campaign.max_score}) của phong trào.`);
      return;
    }

    // Kiểm tra các trường bắt buộc
    if (!updatedActivity.registration_start || !updatedActivity.registration_end) {
      toast.error("Ngày bắt đầu và kết thúc đăng ký là bắt buộc.");
      return;
    }

    try {
      await api.put(`/api/activities/${id}`, updatedActivity);
      await fetchActivities(selectedSemester); // Reload activities
      await fetchPendingActivities(selectedSemester); // Reload pending activities
      await refreshCampaigns(); // Refresh campaigns to update activity counts
      toast.success("Cập nhật hoạt động thành công ✨");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật hoạt động thất bại ❌");
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
      await fetchActivities(selectedSemester); 
      await fetchPendingActivities(selectedSemester);
      await refreshCampaigns();
      setActiveComponent("table");
      toast.success("Import hoạt động thành công 🚀");
      return { success: true };
    } catch (error) {
      console.error(error);
      toast.error("Import hoạt động thất bại ❌");
      return { success: false };
    }
  };

  const handleSortPoint = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle approve activity
  const handleApproveActivity = async (id: number) => {
    try {
      await api.put(`/api/activities/${id}/approve`);
      toast.success("Phê duyệt hoạt động thành công");
      await fetchActivities(selectedSemester); 
      await fetchPendingActivities(selectedSemester); 
      await refreshCampaigns(); 
    } catch (error) {
      console.error("Error approving activity:", error);
      toast.error("Lỗi khi phê duyệt hoạt động");
      throw error;
    }
  };

  // Handle reject activity
  const handleRejectActivity = async (id: number) => {
    try {
      await api.put(`/api/activities/${id}/reject`);
      toast.success("Từ chối hoạt động thành công");
      await fetchActivities(selectedSemester); // Reload activities
      await fetchPendingActivities(selectedSemester); // Reload pending activities
      await refreshCampaigns(); // Refresh campaigns to update activity counts
    } catch (error) {
      console.error("Error rejecting activity:", error);
      toast.error("Lỗi khi từ chối hoạt động");
      throw error;
    }
  };

  // Handle semester change
  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setContextCurrentSemester(semester);
    setCurrentPage(1);
  };

  const renderComponent = () => {
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
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

            {/* Tabs for Approved vs Pending Activities */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <Tab value="approved" title="Đã phê duyệt">
                {/* Filters for Approved Activities */}
                <div className="flex flex-col md:flex-row gap-4 items-center mb-4 p-4 bg-gray-50 rounded-lg">
                  <select
                    value={selectedCampaign}
                    onChange={(e) => {
                      setSelectedCampaign(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
                  >
                    <option value="">-- Tất cả phong trào --</option>
                    {contextCampaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Từ ngày:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Đến ngày:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedCampaign("");
                      setStartDate("");
                      setEndDate("");
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
                  >
                    Xóa bộ lọc
                  </button>
                </div>

                <div className="mt-4">
                  {loadingActivities ? (
                    <Loading />
                  ) : filteredActivities.length > 0 ? (
                    <ActivityTable
                      currentcampaigns={contextCampaigns}
                      activities={currentActivities as Activity[]}
                      onDeleteActivity={openDeleteModal}
                      onUpdateActivity={handleUpdateActivity}
                      onSortPoint={handleSortPoint}
                      sortOrder={sortOrder}
                    />
                  ) : (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <p className="text-gray-500">
                        Không có hoạt động nào trong học kỳ này
                      </p>
                    </div>
                  )}
                </div>
              </Tab>
              <Tab value="pending" title={`Chờ phê duyệt (${filteredPendingActivities.length})`}>
                <div className="flex flex-col md:flex-row gap-4 items-center mb-4 p-4 bg-gray-50 rounded-lg">
                  <select
                    value={selectedCampaign}
                    onChange={(e) => {
                      setSelectedCampaign(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
                  >
                    <option value="">-- Tất cả phong trào --</option>
                    {contextCampaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Từ ngày:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Đến ngày:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedCampaign("");
                      setStartDate("");
                      setEndDate("");
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
                  >
                    Xóa bộ lọc
                  </button>
                </div>

                <div className="mt-4">
                  {loadingPendingActivities ? (
                    <Loading />
                  ) : filteredPendingActivities.length > 0 ? (
                    <PendingActivityTable
                      currentcampaigns={contextCampaigns}
                      activities={filteredPendingActivities as Activity[]}
                      onApproveActivity={handleApproveActivity}
                      onRejectActivity={handleRejectActivity}
                    />
                  ) : (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <p className="text-gray-500">Không có hoạt động nào đang chờ phê duyệt trong học kỳ này</p>
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>

            {filteredActivities.length > itemsPerPage && activeTab === "approved" && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 cursor-pointer rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => changePage(index + 1)}
                    className={`px-3 py-1 cursor-pointer rounded-md ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 cursor-pointer rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        );
    }
  };

  if (dataLoading) {
    return (
      <Loading />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý Hoạt động</h1>
      <div className="flex justify-end gap-4">
        {activeComponent !== "table" && (
          <button
            onClick={() => setActiveComponent("table")}
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay về danh sách
          </button>
        )}
      </div>
      <div>{renderComponent()}</div>

      <ConfirmDeleteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}