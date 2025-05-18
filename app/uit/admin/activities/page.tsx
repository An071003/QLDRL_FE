"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";
import ActivityForm from "@/components/form/ActivityForm";
import ActivityImport from "@/components/Import/ActivityImport";
import ActivityTable from "@/components/Table/ActivityTable";
import PendingActivityTable from "@/components/Table/PendingActivityTable";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Loading from "@/components/Loading";
import { Tabs, Tab } from "@/components/Tabs";
import { ArrowDownUp } from "lucide-react";

export default function ActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<"form" | "import" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("approved");
  
  // Lấy danh sách campaign_id đang được sử dụng trong activities
  const usedCampaignIds = Array.from(new Set(activities.map(a => a.campaign_id)));

  // Tạo options cho bộ lọc học kỳ từ các campaign có activity
  const semesterOptions = (() => {
    const options: {label: string, value: string}[] = [];
    const added = new Set<string>();
    
    campaigns.filter(campaign => usedCampaignIds.includes(campaign.id)).forEach(campaign => {
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
  })();

  const itemsPerPage = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  // Hàm chung để tải dữ liệu
  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Tải campaigns trước
      const campaignsRes = await api.get("/api/campaigns");
      const campaignsData = campaignsRes.data.data.campaigns;
      setCampaigns(campaignsData);
      
      // Sau đó tải toàn bộ activities
      const activitiesRes = await api.get("/api/activities");
      let allActivities;
      
      if (activitiesRes.data.data.activities) {
        allActivities = activitiesRes.data.data.activities;
      } else {
        allActivities = activitiesRes.data.data;
      }
      
      // Thêm thông tin campaign_name vào activities
      allActivities = allActivities.map((activity: Partial<Activity>) => {
        const campaign = campaignsData.find((c: Campaign) => c.id === activity.campaign_id);
        return {
          ...activity,
          campaign_name: campaign ? campaign.name : "Không xác định",
          // Thêm thông tin học kỳ từ campaign
          semester_no: campaign?.semester_no,
          academic_year: campaign?.academic_year
        };
      });
      
      // Phân loại activities thành đã duyệt và chưa duyệt
      const approved = allActivities.filter((activity: Activity) => activity.approver_id !== null);
      const pending = allActivities.filter((activity: Activity) => activity.approver_id === null);
      
      setActivities(approved);
      setPendingActivities(pending);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

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
      await fetchActivities();
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
      await fetchActivities();
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
    const campaign = campaigns.find(c => c.id === updatedActivity.campaign_id);
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
      await fetchActivities();
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
      await fetchActivities();
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

  const filteredActivities = activities
    .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((activity) => {
      if (selectedSemester === "all") return true;
      
      // Tìm campaign tương ứng với hoạt động
      const campaign = campaigns.find(c => c.id === activity.campaign_id);
      if (!campaign) return false;
      
      // Kiểm tra xem campaign có match với semester đã chọn không
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

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);

  const changePage = (page: number) => {
    setCurrentPage(page);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle approve activity
  const handleApproveActivity = async (id: number) => {
    try {
      await api.put(`/api/activities/${id}/approve`);
      toast.success("Phê duyệt hoạt động thành công");
      fetchActivities();
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
      fetchActivities();
    } catch (error) {
      console.error("Error rejecting activity:", error);
      toast.error("Lỗi khi từ chối hoạt động");
      throw error;
    }
  };

  const renderComponent = () => {
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
                      currentcampaigns={campaigns}
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
              <Tab value="pending" title={`Chờ phê duyệt (${pendingActivities.length})`}>
                <div className="mt-4">
                  {pendingActivities.length > 0 ? (
                    <PendingActivityTable
                      currentcampaigns={campaigns}
                      activities={pendingActivities}
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

  if (loading) {
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
