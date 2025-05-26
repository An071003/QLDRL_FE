"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import CampaignForm from "@/components/form/CampaignForm";
import CampaignImport from "@/components/Import/CampaignImport";
import CampaignTable from "@/components/Table/CampaignTable";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Loading from "@/components/Loading";
import axios from "axios";
import { useData } from "@/lib/contexts/DataContext";

export default function CampaignManagement() {
  const { campaigns, criteria, loading, refreshData } = useData();
  const [activeComponent, setActiveComponent] = useState<'form' | 'import' | 'table'>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  const handleCreateCampaign = async (newCampaign: { 
    name: string; 
    max_score: number; 
    criteria_id: number; 
    semester_no: number; 
    academic_year: number 
  }) => {
    try {
      await api.post("/api/campaigns", newCampaign);
      await refreshData();
      setActiveComponent("table");
      toast.success("Thêm phong trào thành công 🎉");
      return { success: true };
    } catch (error: unknown) {
      console.error(error);
      toast.error("Thêm phong trào thất bại ❌");
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
      await api.delete(`/api/campaigns/${selectedId}`);
      await refreshData();
      toast.success("Xóa phong trào thành công ✅");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Xóa phong trào thất bại ❌");
    } finally {
      setModalOpen(false);
      setSelectedId(null);
    }
  };

  const handleUpdateCampaign = async (id: number, updatedCampaign: { 
    name: string; 
    max_score: number; 
    criteria_id: number; 
    semester_no: number; 
    academic_year: number 
  }) => {
    try {
      await api.put(`/api/campaigns/${id}`, updatedCampaign);
      await refreshData();
      toast.success("Cập nhật phong trào thành công ✨");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Cập nhật phong trào thất bại ❌");
    }
  };

  const handleCampaignsImported = async (importedCampaigns: { 
    name: string; 
    max_score: number; 
    criteria_id: number; 
    semester_no: number; 
    academic_year: number;
    created_by: number;
  }[]) => {
    try {
      console.log("Attempting to import campaigns:", importedCampaigns);
      const response = await api.post("/api/campaigns/import", importedCampaigns);
      console.log("Import response:", response.data);
      
      await refreshData();
      setActiveComponent("table");
      
      if (response.data.status === "partial") {
        toast.success(`${response.data.message}`);
        console.log("Failed imports:", response.data.data.failed);
      } else {
        toast.success("Import phong trào thành công 🚀");
      }
      return { success: true };
    } catch (error: unknown) {
      console.error("Import error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Lỗi: ${error.response.data.message || "Import thất bại"} ❌`);
      } else {
        toast.error("Import phong trào thất bại ❌");
      }
      return { success: false };
    }
  };

  const handleSortMaxScore = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  // Group campaigns by semester_no and academic_year
  const semesterOptions = [...new Set(campaigns
    .filter(c => c.semester_no && c.academic_year)
    .map(c => `Học kỳ ${c.semester_no} (${c.academic_year})|${c.semester_no}_${c.academic_year}`))];

  const filteredCampaigns = campaigns
    ? campaigns
        .filter((campaign) =>
          campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter((campaign) => {
          if (selectedSemester === "all") return true;
          const [semesterNo, academicYear] = selectedSemester.split('_');
          return campaign.semester_no === parseInt(semesterNo) && 
                 campaign.academic_year === parseInt(academicYear);
        })
        .sort((a, b) => {
          if (sortOrder === "asc") {
            return a.max_score - b.max_score;
          } else {
            return b.max_score - a.max_score;
          }
        })
    : [];

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCampaigns = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);

  const changePage = (page: number) => {
    setCurrentPage(page);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "form":
        return <CampaignForm criteria={criteria} onCampaignCreated={handleCreateCampaign} />;
      case "import":
        return <CampaignImport criteria={criteria} onCampaignsImported={handleCampaignsImported} />;
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
                placeholder="Tìm kiếm theo tên phong trào..."
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
                {semesterOptions.map((option) => {
                  const [label, id] = option.split("|");
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <div className="flex justify-end gap-4 ">

                <button
                  onClick={() => setActiveComponent("form")}
                  className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + Thêm phong trào
                </button>
                <button
                  onClick={() => setActiveComponent("import")}
                  className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Import phong trào
                </button>

              </div>
            </div>

            <CampaignTable
              campaigns={currentCampaigns}
              criterias={criteria}
              onDeleteCampaign={openDeleteModal}
              onUpdateCampaign={handleUpdateCampaign}
              onSortMaxScore={handleSortMaxScore}
              sortOrder={sortOrder}
            />

            {filteredCampaigns.length > itemsPerPage && (
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
      <h1 className="text-3xl font-bold mb-6">Quản lý Phong trào</h1>
      <div className="flex justify-end gap-4 ">
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
