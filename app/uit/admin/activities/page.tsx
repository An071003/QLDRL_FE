"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Activity } from "@/types/activity";
import { ErrorModal } from "@/components/ErrorModal";
import ActivityForm from "@/components/ActivityForm";
import ActivityImport from "@/components/ActivityImport";
import ActivityTable from "@/components/ActivityTable";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

export default function ActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<"form" | "import" | "table">("table");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/activities");
      setActivities(res.data.data.activities);
    } catch (err) {
      console.error(err);
      setError("Lỗi tải danh sách hoạt động.");
      toast.error("Không thể tải danh sách hoạt động ❌");
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
    is_negative: boolean;
    negativescore: number;
  }) => {
    try {
      await api.post("/api/activities", newActivity);
      await fetchActivities();
      setActiveComponent("table");
      toast.success("Thêm hoạt động thành công 🎉");
      setError("");
      return { success: true };
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi tạo hoạt động.");
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
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi xóa hoạt động.");
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
    }
  ) => {
    try {
      await api.put(`/api/activities/${id}`, updatedActivity);
      await fetchActivities();
      toast.success("Cập nhật hoạt động thành công ✨");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi cập nhật hoạt động.");
      toast.error("Cập nhật hoạt động thất bại ❌");
    }
  };

  const handleActivitiesImported = async (importedActivities: {
    name: string;
    point: number;
    campaign_id: number;
    is_negative: boolean;
    negativescore: number;
  }[]) => {
    try {
      await api.post("/api/activities/import", importedActivities);
      await fetchActivities();
      setActiveComponent("table");
      toast.success("Import hoạt động thành công 🚀");
      return { success: true };
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi import hoạt động.");
      toast.error("Import hoạt động thất bại ❌");
      return { success: false };
    }
  };

  const handleSortPoint = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const filteredActivities = activities
    .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const renderComponent = () => {
    switch (activeComponent) {
      case "form":
        return <ActivityForm onActivityCreated={handleCreateActivity} />;
      case "import":
        return <ActivityImport onActivitiesImported={handleActivitiesImported} />;
      default:
        return (
          <>
            <div ref={tableRef} className="mb-6">
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
            </div>

            <ActivityTable
              activities={currentActivities}
              onDeleteActivity={openDeleteModal}
              onUpdateActivity={handleUpdateActivity}
              onSortPoint={handleSortPoint}
              sortOrder={sortOrder}
            />

            {filteredActivities.length > itemsPerPage && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => changePage(index + 1)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
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
      <div className="flex justify-center items-center h-96">
        <div className="text-xl">Đang tải hoạt động...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý Hoạt động</h1>

      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      <div className="flex justify-end gap-4 mb-6">
        {activeComponent === "table" ? (
          <>
            <button
              onClick={() => setActiveComponent("form")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm hoạt động
            </button>
            {/* <button
              onClick={() => setActiveComponent("import")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import hoạt động
            </button> */}
          </>
        ) : (
          <button
            onClick={() => setActiveComponent("table")}
            className="px-4 py-2 bg-rose-400 text-white rounded hover:bg-rose-700"
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
