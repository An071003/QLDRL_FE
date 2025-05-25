"use client";

import { useState, useRef, useMemo } from "react";
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

export default function ActivityManagement() {
  const { activities: contextActivities, pendingActivities: contextPendingActivities, campaigns: contextCampaigns, loading: dataLoading, refreshActivities } = useData();
  const [activeComponent, setActiveComponent] = useState<"form" | "import" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("approved");
  
  const itemsPerPage = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  // Tính toán usedCampaignIds từ contextActivities
  const usedCampaignIds = useMemo(() => {
    return Array.from(new Set(contextActivities.map(a => a.campaign_id)));
  }, [contextActivities]);

  const semesterOptions = useMemo(() => {
    const options: {label: string, value: string}[] = [];
    const added = new Set<string>();
    
    contextCampaigns.filter(campaign => usedCampaignIds.includes(campaign.id)).forEach(campaign => {
      if (campaign.semester_no && campaign.academic_year) {
        const nextYear = campaign.academic_year + 1;
        const semesterLabel = campaign.semester_no === 3 
          ? `Học kỳ Hè (${campaign.academic_year} - ${nextYear})` 
          : `Học kỳ ${campaign.semester_no} (${campaign.academic_year} - ${nextYear})`;
        const value = `${campaign.semester_no}_${campaign.academic_year}`;
        if (!added.has(value)) {
          options.push({ label: semesterLabel, value });
          added.add(value);
        }
      }
    });
    return options;
  }, [contextCampaigns, usedCampaignIds]);

  // Tính toán filteredActivities từ contextActivities
  const filteredActivities = useMemo(() => {
    return contextActivities
      .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((activity) => {
        if (selectedSemester === "all") return true;
        
        const campaign = contextCampaigns.find(c => c.id === activity.campaign_id);
        if (!campaign) return false;
        
        const [semester_no, academic_year] = selectedSemester.split("_");
        return campaign.semester_no?.toString() === semester_no && 
               campaign.academic_year?.toString() === academic_year;
      })
      .sort((a, b) => {
        if (sortOrder === "asc") {
          return a.point - b.point;
        } else {
          return b.point - a.point;
        }
      });
  }, [contextActivities, searchTerm, selectedSemester, sortOrder, contextCampaigns]);

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
      await refreshActivities();
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
      await refreshActivities();
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
      await refreshActivities();
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
      await refreshActivities();
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
      await refreshActivities();
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
      await refreshActivities();
    } catch (error) {
      console.error("Error rejecting activity:", error);
      toast.error("Lỗi khi từ chối hoạt động");
      throw error;
    }
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "form":
        return <ActivityForm currentcampaigns={contextCampaigns} onActivityCreated={handleCreateActivity} />;
      case "import":
        return <ActivityImport onActivitiesImported={handleActivitiesImported} currentcampaigns={contextCampaigns} />;
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

            {/* Tabs for Approved vs Pending Activities */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <Tab value="approved" title="Đã phê duyệt">
                <div className="mt-4">
                  {filteredActivities.length > 0 ? (
                    <ActivityTable
                      currentcampaigns={contextCampaigns}
                      activities={currentActivities}
                      onDeleteActivity={openDeleteModal}
                      onUpdateActivity={handleUpdateActivity}
                      onSortPoint={handleSortPoint}
                      sortOrder={sortOrder}
                    />
                  ) : (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <p className="text-gray-500">Không có hoạt động nào đã được phê duyệt</p>
                    </div>
                  )}
                </div>
              </Tab>
              <Tab value="pending" title={`Chờ phê duyệt (${contextPendingActivities.length})`}>
                <div className="mt-4">
                  {contextPendingActivities.length > 0 ? (
                    <PendingActivityTable
                      currentcampaigns={contextCampaigns}
                      activities={contextPendingActivities}
                      onApproveActivity={handleApproveActivity}
                      onRejectActivity={handleRejectActivity}
                      onUpdateActivity={handleUpdateActivity}
                    />
                  ) : (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <p className="text-gray-500">Không có hoạt động nào đang chờ phê duyệt</p>
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
